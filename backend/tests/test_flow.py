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
