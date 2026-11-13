import base64
import datetime as dt
import hashlib
import json
import os

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.x509.oid import NameOID

from app.sdjwt_verify import b64e, build_presentation, verify_presentation
from tests.conftest import token

AUD, NONCE = "library-desk", "n-123"


def _sign(key, signing_input: str) -> str:
    r, s = decode_dss_signature(key.sign(signing_input.encode(), ec.ECDSA(hashes.SHA256())))
    return b64e(r.to_bytes(32, "big") + s.to_bytes(32, "big"))


def make_credential(valid_until="2099-06-30", status="ACTIVE", cid="CID-1"):
    """Simulates what Certify issues: ES256 JWT with x5c, hashed disclosures, cnf did:jwk."""
    ik = ec.generate_private_key(ec.SECP256R1())
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "test-issuer")])
    now = dt.datetime.now(dt.timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(ik.public_key())
            .serial_number(1).not_valid_before(now).not_valid_after(now + dt.timedelta(days=30)).sign(ik, hashes.SHA256()))
    hk = ec.generate_private_key(ec.SECP256R1())
    n = hk.public_key().public_numbers()
    jwk = {"kty": "EC", "crv": "P-256", "x": b64e(n.x.to_bytes(32, "big")), "y": b64e(n.y.to_bytes(32, "big"))}
    fields = {"name": "Priya", "roll_number": "21CS042", "branch": "CS", "enrollment_status": status, "valid_until": valid_until}
    discs = [b64e(json.dumps([f"salt{i}", k, v]).encode()) for i, (k, v) in enumerate(fields.items())]
    payload = {"iss": "http://issuer", "vct": "CampusID", "credential_id": cid,
               "cnf": {"kid": "did:jwk:" + b64e(json.dumps(jwk).encode()) + "#0"},
               "_sd": [b64e(hashlib.sha256(d.encode()).digest()) for d in discs]}
    head = {"alg": "ES256", "typ": "vc+sd-jwt", "x5c": [base64.b64encode(cert.public_bytes(serialization.Encoding.DER)).decode()]}
    si = b64e(json.dumps(head).encode()) + "." + b64e(json.dumps(payload).encode())
    cred = si + "." + _sign(ik, si) + "~" + "~".join(discs) + "~"
    pem = hk.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    return cred, pem, cert.fingerprint(hashes.SHA256()).hex()


def present(cred, pem, reveal, aud=AUD, nonce=NONCE):
    return build_presentation(cred, pem, reveal, aud, nonce)


def check(p, **kw):
    return verify_presentation(p, expected_nonce=kw.pop("nonce", NONCE), expected_aud=kw.pop("aud", AUD), **kw)


def test_valid_with_hidden_fields():
    cred, pem, _ = make_credential()
    r = check(present(cred, pem, ["roll_number", "enrollment_status", "valid_until"]))
    assert r["status"] == "valid", r
    assert set(r["claims"]) == {"credential_id", "roll_number", "enrollment_status", "valid_until"}
    assert r["hidden"] == 2 and "name" not in r["claims"]


def test_revoked():
    cred, pem, _ = make_credential()
    r = check(present(cred, pem, ["roll_number"]), revoked_ids={"CID-1"})
    assert r["status"] == "revoked"


def test_tampered_credential_rejected():
    cred, pem, _ = make_credential()
    p = present(cred, pem, ["roll_number"])
    head, body, rest = p.split(".", 2)
    forged = json.loads(base64.urlsafe_b64decode(body + "=="))
    forged["credential_id"] = "CID-OTHER"
    bad = head + "." + b64e(json.dumps(forged).encode()) + "." + rest
    assert check(bad)["status"] == "invalid"


def test_forged_disclosure_rejected():
    cred, pem, _ = make_credential()
    p = present(cred, pem, ["roll_number"])
    fake = b64e(json.dumps(["s", "branch", "Law"]).encode())
    jwt, rest = p.split("~", 1)
    assert check(jwt + "~" + fake + "~" + rest)["status"] == "invalid"


def test_replay_wrong_nonce_and_audience():
    cred, pem, _ = make_credential()
    p = present(cred, pem, ["roll_number"])
    assert check(p, nonce="other")["status"] == "invalid"
    assert check(p, aud="someone-else")["status"] == "invalid"


def test_other_holder_key_rejected():
    cred, _, _ = make_credential()
    _, other_pem, _ = make_credential()
    assert check(present(cred, other_pem, ["roll_number"]))["status"] == "invalid"


def test_extra_disclosure_after_signing_rejected():
    cred, pem, _ = make_credential()
    p = present(cred, pem, ["roll_number"])
    jwt, d1, kb = p.split("~")
    extra = [d for d in cred.split("~")[1:] if d][0]
    assert check("~".join([jwt, d1, extra, kb]))["status"] == "invalid"  # sd_hash no longer matches


def test_no_key_binding_rejected():
    cred, pem, _ = make_credential()
    assert check(cred)["status"] == "invalid"


def test_expired_and_pin():
    cred, pem, fp = make_credential(valid_until="2000-01-01")
    assert check(present(cred, pem, ["valid_until"]))["status"] == "invalid"
    cred, pem, fp = make_credential()
    assert check(present(cred, pem, ["roll_number"]), pin_sha256=fp)["status"] == "valid"
    assert check(present(cred, pem, ["roll_number"]), pin_sha256="00" * 32)["status"] == "invalid"


def test_garbage_does_not_crash():
    assert check("garbage")["status"] == "invalid"
    assert check("a.b.c~d~e.f.g")["status"] == "invalid"


async def test_verify_endpoint_revoked_flow(client):
    a = await token(client, "admin", "admin123")
    v = await token(client, "verifier", "verifier123")
    cred, pem, _ = make_credential(cid="CID-9")
    body = {"presentation": present(cred, pem, ["roll_number"]), "nonce": NONCE, "aud": AUD}
    await client.post("/api/v1/credentials", headers=a, json={
        "credential_id": "CID-9", "roll_number": "21CS042", "status_list_credential": "n/a", "status_list_index": 0})
    r = (await client.post("/api/v1/verify", json=body, headers=v)).json()
    assert r["status"] == "valid" and r["registered"] is True and "name" not in r["claims"]
    await client.post("/api/v1/credentials/CID-9/revoke", headers=a)
    body["presentation"] = present(cred, pem, ["roll_number"])
    assert (await client.post("/api/v1/verify", json=body, headers=v)).json()["status"] == "revoked"
    assert (await client.post("/api/v1/verify", json=body)).status_code == 401
