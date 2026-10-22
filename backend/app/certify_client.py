import httpx

from app.config import settings
from app.models import CredentialRecord


class CertifyClient:
    """Calls Inji Certify's POST /credentials/status to flip the status-list bit."""

    async def create_offer(self, claims: dict) -> str:
        """Asks Certify for a pre-authorized credential offer; returns the offer URI the wallet redeems."""
        if settings.certify_mock:
            return "mock://credential-offer/" + claims["credential_id"]
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"{settings.certify_base_url}/pre-authorized-data",
                             json={"credential_configuration_id": "CampusID", "claims": claims})
            r.raise_for_status()
        out = r.json()
        if out.get("errors"):
            raise httpx.HTTPError(str(out["errors"]))
        body = out.get("response") if isinstance(out.get("response"), dict) else out
        uri = body.get("credential_offer_uri")
        if not uri:
            raise httpx.HTTPError("Certify returned no credential offer")
        return uri

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
