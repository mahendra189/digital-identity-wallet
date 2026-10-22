from sqlalchemy import inspect

from app.models import CredentialRecord
from tests.conftest import token

CRED = {"credential_id": "cid-1", "roll_number": "21CS001", "status_list_credential": "http://x/status-list/1", "status_list_index": 7}


async def test_login_bad(client):
    r = await client.post("/api/v1/auth/login", json={"username": "admin", "password": "no"})
    assert r.status_code == 401 and r.json()["detail"]["error"]["code"] == "BAD_CREDENTIALS"


async def test_issue_revoke_flow(client):
    a = await token(client, "admin", "admin123")
    v = await token(client, "verifier", "verifier123")
    assert (await client.post("/api/v1/credentials", json=CRED, headers=a)).status_code == 201
    assert (await client.post("/api/v1/credentials", json=CRED, headers=a)).status_code == 409
    assert (await client.get("/api/v1/revocations/cid-1", headers=v)).json()["revoked"] is False
    assert (await client.post("/api/v1/credentials/cid-1/revoke", headers=a)).json()["revoked_at"]
    assert (await client.get("/api/v1/revocations/cid-1", headers=v)).json()["revoked"] is True
    assert (await client.get("/api/v1/revocations")).json() == ["cid-1"]
    assert (await client.post("/api/v1/credentials/cid-1/revoke", headers=a)).status_code == 409
    acts = [x["action"] for x in (await client.get("/api/v1/audit", headers=a)).json()]
    assert acts == ["REVOKE", "ISSUE"]


async def test_rbac(client):
    v = await token(client, "verifier", "verifier123")
    assert (await client.post("/api/v1/credentials", json=CRED, headers=v)).status_code == 403
    assert (await client.get("/api/v1/audit")).status_code == 401
    assert (await client.post("/api/v1/credentials/nope/revoke", headers=await token(client, "admin", "admin123"))).status_code == 404


def test_no_credential_content_columns():
    cols = {c.name for c in CredentialRecord.__table__.columns}
    assert not cols & {"name", "branch", "photo", "marks", "claims", "payload", "credential"}


async def test_admin_portal_served(client):
    r = await client.get("/admin/")
    assert r.status_code == 200
    assert "Campus ID" in r.text


async def test_verifier_portal_served(client):
    r = await client.get("/verifier/")
    assert r.status_code == 200
    assert "Verifier" in r.text


class _FakeCertify:
    def __init__(self):
        self.claims = None

    async def create_offer(self, claims):
        self.claims = claims
        return "openid-credential-offer://?credential_offer_uri=https://x/offer/1"


async def test_issue_creates_offer_and_registers(client):
    from app.certify_client import get_certify_client
    from app.main import app
    fake = _FakeCertify()
    app.dependency_overrides[get_certify_client] = lambda: fake
    try:
        h = await token(client, "admin", "admin123")
        body = {"name": "Priya Sharma", "roll_number": "21CS042", "branch": "Computer Science", "valid_until": "2028-06-30"}
        r = await client.post("/api/v1/credentials/issue", json=body, headers=h)
        assert r.status_code == 201
        assert r.json()["credential_id"] == "CID-21CS042"
        assert r.json()["credential_offer_uri"].startswith("openid-credential-offer://")
        assert fake.claims["enrollment_status"] == "ACTIVE" and fake.claims["credential_id"] == "CID-21CS042"
        assert (await client.post("/api/v1/credentials/issue", json=body, headers=h)).status_code == 409
        ids = [c["credential_id"] for c in (await client.get("/api/v1/credentials", headers=h)).json()]
        assert ids == ["CID-21CS042"]
        v = await token(client, "verifier", "verifier123")
        assert (await client.post("/api/v1/credentials/issue", json=body, headers=v)).status_code == 403
    finally:
        app.dependency_overrides.clear()
