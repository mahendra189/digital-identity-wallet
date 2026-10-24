import base64
import json
import secrets
import time
import urllib.parse
from datetime import date, datetime, timezone
from typing import Any


import httpx
from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.certify_client import CertifyClient, OFFER_STORE, VCI_TOKENS, get_certify_client
from app.config import settings
from app.db import get_session
from app.deps import current_user, require_admin, require_verifier
from app.errors import api_error
from app.issuer_crypto import issue_sdjwt_credential
from app.models import Account, AuditLog, CredentialRecord
from app.schemas import (
    AuditOut,
    CredentialCreate,
    CredentialOut,
    IssueOut,
    IssueRequest,
    LoginRequest,
    PresentationRequestCreate,
    PresentationRequestOut,
    RevocationStatus,
    TokenResponse,
    VciCredentialRequest,
    VciCredentialResponse,
    VciTokenRequest,
    VciTokenResponse,
    VerifyRequest,
    VerifyResult,
)
from app.sdjwt_verify import _es256_verify, _holder_key, _jwt_parts, verify_presentation
from app.security import (
    check_rate_limit,
    clear_failed_attempts,
    create_token,
    decode_token,
    record_failed_attempt,
    revoke_token,
    verify_password,
)

router = APIRouter(prefix="/api/v1")

# Store active verifier presentation requests: nonce -> request details
ACTIVE_PRESENTATION_REQUESTS: dict[str, dict[str, Any]] = {}
# Track consumed nonces to prevent replay even when request metadata is unavailable.
USED_PRESENTATION_NONCES: dict[str, float] = {}


# --- Authentication & Session Management ---

@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, req: Request, s: AsyncSession = Depends(get_session)) -> TokenResponse:
    rate_key = f"{req.client.host if req.client else 'unknown'}:{body.username}"
    if not check_rate_limit(rate_key):
        raise api_error(429, "RATE_LIMITED", "Too many failed login attempts. Please wait 5 minutes.")

    acct = (await s.execute(select(Account).where(Account.username == body.username))).scalar_one_or_none()
    if not acct or not verify_password(body.password, acct.password_hash):
        record_failed_attempt(rate_key)
        raise api_error(401, "BAD_CREDENTIALS", "Invalid username or password")

    clear_failed_attempts(rate_key)
    token = create_token(acct.username, acct.role)
    return TokenResponse(access_token=token, role=acct.role)



@router.get("/auth/me")
async def get_current_account(user: dict = Depends(current_user)) -> dict[str, str]:
    return {"username": user["sub"], "role": user["role"]}


@router.post("/auth/logout")
async def logout(user: dict = Depends(current_user)) -> dict[str, str]:
    jti = user.get("jti")
    if jti:
        revoke_token(jti)
    return {"status": "logged_out"}


# --- OpenID4VCI Issuer Endpoints ---

@router.get("/.well-known/openid-credential-issuer")
async def get_issuer_metadata() -> dict[str, Any]:
    """OpenID4VCI metadata endpoint."""
    return {
        "credential_issuer": settings.public_base_url,
        "credential_endpoint": f"{settings.public_base_url}/api/v1/issuer/credential",
        "token_endpoint": f"{settings.public_base_url}/api/v1/issuer/token",
        "credential_configurations_supported": {
            "CampusID": {
                "format": "vc+sd-jwt",
                "scope": "campus_id_vc_sdjwt",
                "vct": "CampusID",
                "cryptographic_binding_methods_supported": ["did:jwk", "jwk"],
                "credential_signing_alg_values_supported": ["ES256"],
                "proof_types_supported": {
                    "jwt": {"proof_signing_alg_values_supported": ["ES256"]}
                },
                "claims": {
                    "name": {"mandatory": False},
                    "roll_number": {"mandatory": False},
                    "branch": {"mandatory": False},
                    "enrollment_status": {"mandatory": True},
                    "valid_until": {"mandatory": True},
                    "credential_id": {"mandatory": True},
                },
            }
        },
    }


@router.post("/issuer/token", response_model=VciTokenResponse)
async def exchange_vci_token(body: VciTokenRequest) -> VciTokenResponse:
    """OpenID4VCI token endpoint exchanging pre-authorized code for an issuance token."""
    code = body.pre_authorized_code
    offer = OFFER_STORE.get(code)
    if not offer:
        raise api_error(400, "INVALID_GRANT", "Unknown or expired pre-authorized code")
    if offer.get("redeemed"):
        raise api_error(400, "GRANT_REDEEMED", "Pre-authorized code has already been claimed")

    # Mark code as redeemed (single-use)
    offer["redeemed"] = True
    access_token = secrets.token_hex(24)
    c_nonce = secrets.token_hex(16)
    VCI_TOKENS[access_token] = {
        "claims": offer["claims"],
        "c_nonce": c_nonce,
        "expires_at": time.time() + 300,
    }
    return VciTokenResponse(access_token=access_token, token_type="Bearer", expires_in=300, c_nonce=c_nonce)


@router.post("/issuer/credential", response_model=VciCredentialResponse)
async def issue_vci_credential(
    body: VciCredentialRequest,
    authorization: str | None = Header(default=None),
) -> VciCredentialResponse:
    """OpenID4VCI credential endpoint issuing an authentic SD-JWT with holder proof verification."""
    if not authorization or not authorization.startswith("Bearer "):
        raise api_error(401, "UNAUTHORIZED", "Missing bearer token for issuance")
    token = authorization[7:]
    session = VCI_TOKENS.get(token)
    if not session or session["expires_at"] < time.time():
        raise api_error(401, "EXPIRED_TOKEN", "Issuance token is invalid or expired")

    # 1. Verify holder proof of possession (JWT)
    proof_obj = body.proof
    if not isinstance(proof_obj, dict) or proof_obj.get("proof_type") != "jwt":
        raise api_error(400, "INVALID_PROOF", "Proof must be a JWT")
    proof_jwt = proof_obj.get("jwt")
    if not proof_jwt or not isinstance(proof_jwt, str):
        raise api_error(400, "INVALID_PROOF", "Missing proof JWT")

    try:
        proof_hdr, proof_pay = _jwt_parts(proof_jwt)
    except Exception as e:
        raise api_error(400, "MALFORMED_PROOF", f"Malformed proof JWT: {e}")

    # Validate proof header & holder key
    kid = proof_hdr.get("kid")
    jwk = proof_hdr.get("jwk")
    cnf: dict[str, Any]
    if kid and isinstance(kid, str):
        cnf = {"kid": kid}
    elif jwk and isinstance(jwk, dict):
        cnf = {"jwk": jwk}
    else:
        raise api_error(400, "INVALID_PROOF", "Proof header must include kid or jwk")

    try:
        holder_key = _holder_key(cnf)
        _es256_verify(proof_jwt, holder_key)
    except Exception as e:
        raise api_error(400, "INVALID_PROOF_SIGNATURE", f"Holder proof signature verification failed: {e}")

    # Validate proof nonce and audience
    expected_c_nonce = session["c_nonce"]
    if proof_pay.get("nonce") != expected_c_nonce:
        raise api_error(400, "INVALID_NONCE", "Proof nonce does not match issuer c_nonce")
    if proof_pay.get("aud") not in (settings.public_base_url, settings.public_base_url.rstrip("/")):
        # Tolerant of trailing slash
        pass

    # 2. Issue authentic SD-JWT credential bound to holder cnf
    claims = session["claims"]
    signed_sdjwt = issue_sdjwt_credential(
        issuer_url=settings.public_base_url,
        claims=claims,
        holder_cnf=cnf,
    )
    # Invalidate single-use issuance token
    VCI_TOKENS.pop(token, None)
    return VciCredentialResponse(credential=signed_sdjwt)


# --- Credential Lifecycle & Admin ---

@router.post("/credentials", response_model=CredentialOut, status_code=201)
async def register_credential(
    body: CredentialCreate, user: dict = Depends(require_admin), s: AsyncSession = Depends(get_session)
) -> CredentialRecord:
    if await s.get(CredentialRecord, body.credential_id):
        raise api_error(409, "ALREADY_EXISTS", "Credential already registered")
    rec = CredentialRecord(**body.model_dump())
    s.add(rec)
    s.add(AuditLog(actor=user["sub"], action="ISSUE", target=body.credential_id))
    await s.commit()

    return rec


@router.post("/credentials/issue", response_model=IssueOut, status_code=201)
async def issue_credential(
    body: IssueRequest,
    user: dict = Depends(require_admin),
    s: AsyncSession = Depends(get_session),
    certify: CertifyClient = Depends(get_certify_client),
) -> IssueOut:
    credential_id = f"CID-{body.roll_number}"
    if await s.get(CredentialRecord, credential_id):
        raise api_error(409, "ALREADY_EXISTS", f"Campus ID '{credential_id}' was already issued. Please use a different roll number or revoke the existing one.")

    try:
        vu_date = date.fromisoformat(body.valid_until)
        if vu_date < date.today():
            raise api_error(400, "EXPIRED_VALID_UNTIL", f"valid_until ({body.valid_until}) cannot be in the past. Current date is {date.today().isoformat()}. Please select a future date (e.g. 2030-12-31).")
    except ValueError:
        raise api_error(400, "INVALID_VALID_UNTIL", f"Invalid valid_until date format: {body.valid_until}. Expected YYYY-MM-DD.")

    claims = {
        "name": body.name,
        "roll_number": body.roll_number,
        "branch": body.branch,
        "enrollment_status": "ACTIVE",
        "valid_until": body.valid_until,
        "credential_id": credential_id,
    }
    try:
        offer_uri = await certify.create_offer(claims)
    except httpx.HTTPError as e:
        raise api_error(502, "CERTIFY_UNAVAILABLE", f"Could not create the credential offer: {e}")
    except Exception as e:
        raise api_error(500, "OFFER_CREATION_FAILED", f"Credential offer generation failed: {e}")


    s.add(
        CredentialRecord(
            credential_id=credential_id,
            roll_number=body.roll_number,
            status_list_credential="own-backend",
            status_list_index=0,
        )
    )
    s.add(AuditLog(actor=user["sub"], action="ISSUE", target=credential_id))
    await s.commit()
    return IssueOut(credential_id=credential_id, credential_offer_uri=offer_uri, mock=settings.certify_mock)


@router.get("/credentials", response_model=list[CredentialOut])
async def list_credentials(_: dict = Depends(require_admin), s: AsyncSession = Depends(get_session)):
    return (await s.execute(select(CredentialRecord).order_by(CredentialRecord.issued_at.desc()))).scalars().all()


@router.post("/credentials/{credential_id}/revoke", response_model=CredentialOut)
async def revoke_credential(
    credential_id: str,
    user: dict = Depends(require_admin),
    s: AsyncSession = Depends(get_session),
    certify: CertifyClient = Depends(get_certify_client),
) -> CredentialRecord:
    rec = await s.get(CredentialRecord, credential_id)
    if not rec:
        raise api_error(404, "CREDENTIAL_NOT_FOUND", "Unknown credential id")
    if rec.revoked_at:
        raise api_error(409, "ALREADY_REVOKED", "Credential already revoked")
    try:
        await certify.revoke(rec)
    except httpx.HTTPError as e:
        raise api_error(502, "CERTIFY_UNAVAILABLE", f"Certify status update failed: {e}")
    rec.revoked_at = datetime.now(timezone.utc)
    s.add(AuditLog(actor=user["sub"], action="REVOKE", target=credential_id))
    await s.commit()
    return rec


@router.get("/revocations", response_model=list[str])
async def revoked_ids(s: AsyncSession = Depends(get_session)) -> list[str]:
    rows = await s.execute(select(CredentialRecord.credential_id).where(CredentialRecord.revoked_at.is_not(None)))
    return list(rows.scalars().all())


@router.get("/revocations/{credential_id}", response_model=RevocationStatus)
async def revocation_status(credential_id: str, _: dict = Depends(current_user), s: AsyncSession = Depends(get_session)):
    rec = await s.get(CredentialRecord, credential_id)
    if not rec:
        raise api_error(404, "CREDENTIAL_NOT_FOUND", "Unknown credential id")
    return RevocationStatus(credential_id=credential_id, revoked=rec.revoked_at is not None, revoked_at=rec.revoked_at)


@router.get("/audit", response_model=list[AuditOut])
async def audit(_: dict = Depends(require_admin), s: AsyncSession = Depends(get_session)):
    return (await s.execute(select(AuditLog).order_by(AuditLog.id.desc()).limit(200))).scalars().all()


# --- OpenID4VP Presentation & Verification ---

@router.post("/presentation-requests", response_model=PresentationRequestOut)
async def create_presentation_request(
    body: PresentationRequestCreate = PresentationRequestCreate(),
    user: dict = Depends(require_verifier),
) -> PresentationRequestOut:
    """Generates a fresh, unpredictable OpenID4VP presentation request."""
    nonce = secrets.token_hex(16)
    response_uri = f"{settings.public_base_url}/api/v1/presentation"
    ACTIVE_PRESENTATION_REQUESTS[nonce] = {
        "client_id": body.client_id,
        "client_name": body.client_name,
        "purpose": body.purpose,
        "required_claims": body.required_claims,
        "optional_claims": body.optional_claims,
        "created_at": time.time(),
        "created_by": user["sub"],
    }
    req_str = ",".join(body.required_claims)
    opt_str = ",".join(body.optional_claims)
    uri = (
        f"openid4vp://authorize?client_id={body.client_id}&client_name={urllib.parse.quote(body.client_name)}"
        f"&purpose={urllib.parse.quote(body.purpose)}&nonce={nonce}&response_uri={urllib.parse.quote(response_uri)}"
        f"&required_claims={req_str}&optional_claims={opt_str}"
    )
    return PresentationRequestOut(
        nonce=nonce,
        client_id=body.client_id,
        client_name=body.client_name,
        purpose=body.purpose,
        required_claims=body.required_claims,
        optional_claims=body.optional_claims,
        response_uri=response_uri,
        openid4vp_uri=uri,
    )


@router.get("/verifications")
async def recent_verifications(_: dict = Depends(require_verifier), s: AsyncSession = Depends(get_session)) -> list[dict[str, Any]]:
    """Latest verification checks, newest first (credential ID and outcome only, never card contents)."""
    rows = (await s.execute(
        select(AuditLog).where(AuditLog.action.like("VERIFY_%")).order_by(AuditLog.id.desc()).limit(50)
    )).scalars().all()
    return [{"at": r.at, "by": r.actor, "credential_id": r.target, "status": r.action[len("VERIFY_"):].lower()} for r in rows]


@router.get("/presentation-requests/{nonce}")
async def get_presentation_request_status(nonce: str) -> dict[str, Any]:
    req_meta = ACTIVE_PRESENTATION_REQUESTS.get(nonce)
    if not req_meta:
        raise api_error(404, "NOT_FOUND", "Presentation request not found or expired")
    return {
        "nonce": nonce,
        "status": "verified" if "result" in req_meta else "pending",
        "result": req_meta.get("result"),
    }


@router.post("/verify", response_model=VerifyResult)
async def verify(
    body: VerifyRequest,
    authorization: str | None = Header(default=None),
    s: AsyncSession = Depends(get_session),
) -> VerifyResult:
    """Verifies an SD-JWT presentation against the signed request nonce, issuer trust, and revocation."""
    user_sub = "wallet_presentation"
    if authorization and authorization.startswith("Bearer "):
        token_data = decode_token(authorization[7:])
        if not token_data:
            raise api_error(401, "INVALID_TOKEN", "Invalid or expired token")
        user_sub = token_data["sub"]
    else:
        # If no bearer token, must answer an active presentation request nonce
        if body.nonce not in ACTIVE_PRESENTATION_REQUESTS:
            raise api_error(401, "UNAUTHENTICATED", "Missing bearer token")

    now = time.time()
    req_meta = ACTIVE_PRESENTATION_REQUESTS.get(body.nonce)
    used_at = USED_PRESENTATION_NONCES.get(body.nonce)
    if not req_meta and used_at:
        if now - used_at <= 600:
            raise api_error(400, "NONCE_USED", "This request code was already used. Create a new request.")
        USED_PRESENTATION_NONCES.pop(body.nonce, None)
    required_claims = body.required_claims
    if req_meta:
        if not required_claims:
            required_claims = req_meta.get("required_claims")
        if now - req_meta["created_at"] > 600:
            ACTIVE_PRESENTATION_REQUESTS.pop(body.nonce, None)
            raise api_error(400, "EXPIRED_NONCE", "The presentation request nonce has expired")
        if req_meta.get("used"):
            raise api_error(400, "NONCE_USED", "This request code was already used. Create a new request.")

    revoked = set(
        (await s.execute(select(CredentialRecord.credential_id).where(CredentialRecord.revoked_at.is_not(None)))).scalars().all()
    )

    res = verify_presentation(
        body.presentation,
        expected_nonce=body.nonce,
        expected_aud=body.aud,
        required_claims=required_claims,
        revoked_ids=revoked,
        pin_sha256=settings.issuer_cert_sha256,
    )
    cid = res["credential_id"]
    registered = bool(cid and await s.get(CredentialRecord, cid))
    s.add(AuditLog(actor=user_sub, action="VERIFY_" + res["status"].upper(), target=cid or "unknown"))
    await s.commit()

    result_payload = {"registered": registered, **res}
    if req_meta:
        req_meta["result"] = result_payload
        req_meta["used"] = True
        USED_PRESENTATION_NONCES[body.nonce] = now

    return VerifyResult(registered=registered, **res)


# Wallet direct presentation submission endpoint
@router.post("/presentation")
async def receive_wallet_presentation(
    body: dict[str, Any],
    s: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    """Receives direct OpenID4VP presentation dispatch from holder wallet."""
    presentation = body.get("presentation") or body.get("disclosedSDJWT")
    nonce = body.get("nonce")
    aud = body.get("aud") or body.get("client_id") or "campus-verifier"

    if not presentation or not nonce:
        raise api_error(400, "BAD_REQUEST", "Presentation and nonce are required")

    req_meta = ACTIVE_PRESENTATION_REQUESTS.get(nonce)
    now = time.time()
    used_at = USED_PRESENTATION_NONCES.get(nonce)
    if not req_meta and used_at:
        if now - used_at <= 600:
            raise api_error(400, "NONCE_USED", "This request code was already used. Create a new request.")
        USED_PRESENTATION_NONCES.pop(nonce, None)
    if req_meta and req_meta.get("used"):
        raise api_error(400, "NONCE_USED", "This request code was already used. Create a new request.")
    required_claims = body.get("required_claims")
    if req_meta and not required_claims:
        required_claims = req_meta.get("required_claims")

    revoked = set(
        (await s.execute(select(CredentialRecord.credential_id).where(CredentialRecord.revoked_at.is_not(None)))).scalars().all()
    )

    res = verify_presentation(
        presentation,
        expected_nonce=nonce,
        expected_aud=aud,
        required_claims=required_claims,
        revoked_ids=revoked,
        pin_sha256=settings.issuer_cert_sha256,
    )
    cid = res["credential_id"]
    registered = bool(cid and await s.get(CredentialRecord, cid))
    s.add(AuditLog(actor="wallet_presentation", action="VERIFY_" + res["status"].upper(), target=cid or "unknown"))
    await s.commit()

    result_payload = {"registered": registered, **res}
    if req_meta:
        req_meta["result"] = result_payload
        req_meta["used"] = True
        USED_PRESENTATION_NONCES[nonce] = now

    return result_payload
