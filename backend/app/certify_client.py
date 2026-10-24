import json
import secrets
import time
import urllib.parse
from typing import Any

import httpx

from app.config import settings
from app.models import CredentialRecord

# In-memory offer store for pre-authorized OpenID4VCI offers
OFFER_STORE: dict[str, dict[str, Any]] = {}
VCI_TOKENS: dict[str, dict[str, Any]] = {}


class CertifyClient:
    """Communicates with Inji Certify or acts as a local standards-compliant OpenID4VCI issuer."""

    async def create_offer(self, claims: dict[str, Any]) -> str:
        """Asks Certify for a pre-authorized credential offer or generates an authentic OpenID4VCI offer."""
        if settings.certify_mock:
            code = secrets.token_urlsafe(24)
            OFFER_STORE[code] = {
                "claims": claims,
                "created_at": time.time(),
                "redeemed": False,
            }
            # Standard OpenID4VCI offer structure
            offer_data = {
                "credential_issuer": settings.public_base_url,
                "credential_configuration_ids": ["CampusID"],
                "grants": {
                    "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
                        "pre-authorized_code": code,
                    }
                },
            }
            offer_json = urllib.parse.quote(json.dumps(offer_data, separators=(",", ":")))
            return f"openid-credential-offer://?credential_offer={offer_json}"


        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                f"{settings.certify_base_url}/pre-authorized-data",
                json={"credential_configuration_id": "CampusID", "claims": claims},
            )
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


_client_instance = CertifyClient()


def get_certify_client() -> CertifyClient:
    return _client_instance
