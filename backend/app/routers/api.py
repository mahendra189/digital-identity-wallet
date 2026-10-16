import httpx
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.certify_client import CertifyClient, get_certify_client
from app.db import get_session
from app.deps import current_user, require_admin
from app.errors import api_error
from app.models import Account, AuditLog, CredentialRecord
from app.schemas import AuditOut, CredentialCreate, CredentialOut, LoginRequest, RevocationStatus, TokenResponse
from app.security import create_token, verify_password

router = APIRouter(prefix="/api/v1")


@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, s: AsyncSession = Depends(get_session)) -> TokenResponse:
    acct = (await s.execute(select(Account).where(Account.username == body.username))).scalar_one_or_none()
    if not acct or not verify_password(body.password, acct.password_hash):
        raise api_error(401, "BAD_CREDENTIALS", "Invalid username or password")
    return TokenResponse(access_token=create_token(acct.username, acct.role), role=acct.role)


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
