import httpx

from app.config import settings
from app.models import CredentialRecord


class CertifyClient:
    """Calls Inji Certify's POST /credentials/status to flip the status-list bit."""

    async def revoke(self, rec: CredentialRecord) -> None:
        if settings.certify_mock:
            return
        body = {
            "credentialId": rec.credential_id,
            "credentialStatus": {
                "type": "BitstringStatusListEntry",
                "statusPurpose": "revocation",
                "statusListIndex": rec.status_list_index,
                "statusListCredential": rec.status_list_credential,
            },
            "status": True,
        }
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"{settings.certify_base_url}/credentials/status", json=body)
            r.raise_for_status()


def get_certify_client() -> CertifyClient:
    return CertifyClient()
