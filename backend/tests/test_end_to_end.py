import base64
import datetime as dt
import hashlib
import json
import time

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.x509.oid import NameOID

from app.issuer_crypto import b64url, issue_sdjwt_credential
from app.routers.api import ACTIVE_PRESENTATION_REQUESTS
from app.sdjwt_verify import build_presentation, verify_presentation
from app.security import (
    create_token,
    decode_token,
    hash_password,
    revoke_token,
    verify_password,
)
from tests.conftest import token


def test_password_hashing_and_verification():
    pw = "SuperSecurePassword987!"
    stored = hash_password(pw)
    assert stored.count("$") == 2
    salt_hex, iters, dk_hex = stored.split("$")
    assert iters == "600000"
    assert verify_password(pw, stored) is True
    assert verify_password("WrongPassword!", stored) is False

    # Test legacy format (200k iter without iter field)
    legacy = f"{salt_hex}${dk_hex}"
    assert verify_password(pw, legacy) is False  # different iteration count produces different dk


def test_standard_jwt_security_and_lifecycle():
    tok = create_token("alice", "admin")
    parts = tok.split(".")
    assert len(parts) == 3

    # Decode valid token
    decoded = decode_token(tok)
    assert decoded is not None
    assert decoded["sub"] == "alice"
    assert decoded["role"] == "admin"
    assert decoded["iss"] == "campus-id-auth-service"
    assert decoded["aud"] == "campus-id-platform"

    # Revoke session via JTI
    jti = decoded["jti"]
    revoke_token(jti)
    assert decode_token(tok) is None  # Must now be rejected

    # Tampered token rejected
    header, payload, sig = tok.split(".")
    tampered_sig = sig[:-4] + "AAAA"
    assert decode_token(f"{header}.{payload}.{tampered_sig}") is None


def _make_test_holder():
    key = ec.generate_private_key(ec.SECP256R1())
    n = key.public_key().public_numbers()
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": b64url(n.x.to_bytes(32, "big")),
        "y": b64url(n.y.to_bytes(32, "big")),
    }
    did = "did:jwk:" + b64url(json.dumps(jwk).encode()) + "#0"
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    return key, pem, did, jwk


async def test_openid4vci_discovery_and_issuance(client):
    # 1. Metadata discovery
    meta_resp = await client.get("/.well-known/openid-credential-issuer")
    assert meta_resp.status_code == 200
    meta = meta_resp.json()
    assert "CampusID" in meta["credential_configurations_supported"]

    # 2. Admin issues an offer
    admin_auth = await token(client, "admin", "admin123")
    issue_req = {
        "name": "Alex Johnson",
        "roll_number": "24CS999",
        "branch": "Robotics",
        "valid_until": "2029-06-30",
    }
    issue_resp = await client.post("/api/v1/credentials/issue", json=issue_req, headers=admin_auth)
    assert issue_resp.status_code == 201
    offer_uri = issue_resp.json()["credential_offer_uri"]

    # 3. Extract pre-authorized code from offer URI
    assert "credential_offer=" in offer_uri
    import urllib.parse
    qs = urllib.parse.parse_qs(urllib.parse.urlparse(offer_uri).query)
    offer_data = json.loads(urllib.parse.unquote(qs["credential_offer"][0]))
    pre_auth_code = offer_data["grants"]["urn:ietf:params:oauth:grant-type:pre-authorized_code"]["pre-authorized_code"]

    # 4. Exchange code for access token & c_nonce
    tok_resp = await client.post("/api/v1/issuer/token", json={
        "grant_type": "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "pre_authorized_code": pre_auth_code,
    })
    assert tok_resp.status_code == 200
    tok_data = tok_resp.json()
    vci_token = tok_data["access_token"]
    c_nonce = tok_data["c_nonce"]

    # Replay of code must fail (single-use)
    replay_resp = await client.post("/api/v1/issuer/token", json={
        "grant_type": "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "pre_authorized_code": pre_auth_code,
    })
    assert replay_resp.status_code == 400

    # 5. Build holder proof of possession JWT
    holder_key, holder_pem, holder_did, _ = _make_test_holder()
    proof_head = b64url(json.dumps({"alg": "ES256", "typ": "openid4vci-proof+jwt", "kid": holder_did}).encode())
    proof_pay = b64url(json.dumps({"aud": "http://localhost:8000", "iat": int(time.time()), "nonce": c_nonce}).encode())
    sig_input = f"{proof_head}.{proof_pay}".encode()
    r, s = decode_dss_signature(holder_key.sign(sig_input, ec.ECDSA(hashes.SHA256())))
    proof_sig = b64url(r.to_bytes(32, "big") + s.to_bytes(32, "big"))
    proof_jwt = f"{proof_head}.{proof_pay}.{proof_sig}"

    # 6. Request credential
    cred_resp = await client.post(
        "/api/v1/issuer/credential",
        headers={"Authorization": f"Bearer {vci_token}"},
        json={
            "format": "vc+sd-jwt",
            "vct": "CampusID",
            "proof": {"proof_type": "jwt", "jwt": proof_jwt},
        },
    )
    assert cred_resp.status_code == 200
    issued_sdjwt = cred_resp.json()["credential"]
    assert "~" in issued_sdjwt

    # 7. Verifier creates OpenID4VP request
    ver_auth = await token(client, "verifier", "verifier123")
    req_resp = await client.post(
        "/api/v1/presentation-requests",
        headers=ver_auth,
        json={
            "client_id": "campus-verifier",
            "client_name": "Campus Gate",
            "purpose": "Verify enrollment",
            "required_claims": ["enrollment_status", "valid_until"],
            "optional_claims": ["name", "roll_number"],
        },
    )
    assert req_resp.status_code == 200
    vp_req = req_resp.json()
    vp_nonce = vp_req["nonce"]

    # 8. Holder presents selectively: discloses enrollment_status and valid_until, conceals roll_number
    pres = build_presentation(issued_sdjwt, holder_pem, ["enrollment_status", "valid_until"], aud="campus-verifier", nonce=vp_nonce)

    # 9. Verify presentation at /api/v1/verify
    v_result = await client.post(
        "/api/v1/verify",
        headers=ver_auth,
        json={"presentation": pres, "nonce": vp_nonce, "aud": "campus-verifier"},
    )
    assert v_result.status_code == 200
    res_data = v_result.json()
    assert res_data["status"] == "valid"
    assert res_data["registered"] is True
    assert "enrollment_status" in res_data["claims"]
    assert "valid_until" in res_data["claims"]
    assert "roll_number" not in res_data["claims"]  # Selectively withheld

    # 10. Replay with same nonce must be rejected
    v_replay = await client.post(
        "/api/v1/verify",
        headers=ver_auth,
        json={"presentation": pres, "nonce": vp_nonce, "aud": "campus-verifier"},
    )
    assert v_replay.status_code == 400


async def test_verify_rejects_replayed_nonce_if_request_state_is_missing(client):
    ver_auth = await token(client, "verifier", "verifier123")
    holder_key, holder_pem, holder_did, _ = _make_test_holder()

    claims = {
        "name": "Replay Check",
        "roll_number": "24CS001",
        "branch": "CSE",
        "enrollment_status": "ACTIVE",
        "valid_until": "2028-12-31",
        "credential_id": "CID-24CS001",
    }
    sdjwt = issue_sdjwt_credential(
        issuer_url="http://localhost:8000",
        claims=claims,
        holder_cnf={"kid": holder_did},
    )

    req_resp = await client.post(
        "/api/v1/presentation-requests",
        headers=ver_auth,
        json={"client_id": "campus-gate", "client_name": "Campus Gate", "purpose": "Replay check"},
    )
    assert req_resp.status_code == 200
    nonce = req_resp.json()["nonce"]
    pres = build_presentation(sdjwt, holder_pem, ["enrollment_status", "valid_until"], aud="campus-gate", nonce=nonce)

    first = await client.post(
        "/api/v1/verify",
        headers=ver_auth,
        json={"presentation": pres, "nonce": nonce, "aud": "campus-gate"},
    )
    assert first.status_code == 200

    ACTIVE_PRESENTATION_REQUESTS.pop(nonce, None)

    replay = await client.post(
        "/api/v1/verify",
        headers=ver_auth,
        json={"presentation": pres, "nonce": nonce, "aud": "campus-gate"},
    )
    assert replay.status_code == 400


async def test_server_enforces_mandatory_claims(client):
    ver_auth = await token(client, "verifier", "verifier123")
    holder_key, holder_pem, holder_did, _ = _make_test_holder()

    claims = {
        "name": "Bob",
        "roll_number": "21CS002",
        "branch": "EE",
        "enrollment_status": "ACTIVE",
        "valid_until": "2028-12-31",
        "credential_id": "CID-21CS002",
    }
    sdjwt = issue_sdjwt_credential(
        issuer_url="http://localhost:8000",
        claims=claims,
        holder_cnf={"kid": holder_did},
    )

    # Verifier explicitly requires "valid_until"
    # Holder only discloses "enrollment_status" (omits required "valid_until")
    pres = build_presentation(sdjwt, holder_pem, ["enrollment_status"], aud="campus-gate", nonce="nonce_xyz")

    v_res = await client.post(
        "/api/v1/verify",
        headers=ver_auth,
        json={
            "presentation": pres,
            "nonce": "nonce_xyz",
            "aud": "campus-gate",
            "required_claims": ["enrollment_status", "valid_until"],
        },
    )
    assert v_res.status_code == 200
    res = v_res.json()
    assert res["status"] == "invalid"
    assert any("valid_until" in r for r in res["reasons"])


async def test_direct_wallet_presentation_endpoint(client):
    holder_key, holder_pem, holder_did, _ = _make_test_holder()
    claims = {
        "name": "Clara",
        "roll_number": "22CS101",
        "branch": "Mechanical",
        "enrollment_status": "ACTIVE",
        "valid_until": "2030-01-01",
        "credential_id": "CID-22CS101",
    }
    sdjwt = issue_sdjwt_credential(
        issuer_url="http://localhost:8000",
        claims=claims,
        holder_cnf={"kid": holder_did},
    )

    pres = build_presentation(sdjwt, holder_pem, ["enrollment_status", "valid_until"], aud="campus-verifier", nonce="direct_nonce_99")

    # Call /api/v1/presentation
    resp = await client.post(
        "/api/v1/presentation",
        json={"presentation": pres, "nonce": "direct_nonce_99", "aud": "campus-verifier"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "valid"
