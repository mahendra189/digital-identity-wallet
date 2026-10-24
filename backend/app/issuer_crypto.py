"""Issuer cryptographic operations for Campus ID SD-JWT issuance.

Generates and manages the issuer EC P-256 keypair and self-signed X.509 certificate,
and creates RFC 9537 / Inji Certify compliant SD-JWT credentials with real ES256 signatures,
salted disclosures, and holder key confirmation (cnf).
"""
import base64
import datetime
import hashlib
import json
import secrets
from typing import Any

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.x509.oid import NameOID


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def unb64url(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


class IssuerKeyManager:
    _instance = None

    def __init__(self) -> None:
        # Generate persistent in-process issuer EC P-256 private key
        self.private_key = ec.generate_private_key(ec.SECP256R1())
        self.public_key = self.private_key.public_key()

        # Build self-signed X.509 certificate for x5c header
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "National Campus Authority"),
            x509.NameAttribute(NameOID.COMMON_NAME, "Campus ID Root Issuer"),
        ])
        now = datetime.datetime.now(datetime.timezone.utc)
        self.certificate = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(self.public_key)
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - datetime.timedelta(days=1))
            .not_valid_after(now + datetime.timedelta(days=3650))
            .sign(self.private_key, hashes.SHA256())
        )
        self.cert_der = self.certificate.public_bytes(serialization.Encoding.DER)
        self.cert_b64 = base64.b64encode(self.cert_der).decode("ascii")
        self.cert_fingerprint = self.certificate.fingerprint(hashes.SHA256()).hex()

    @classmethod
    def get_instance(cls) -> "IssuerKeyManager":
        if cls._instance is None:
            cls._instance = IssuerKeyManager()
        return cls._instance

    def sign_es256(self, message: bytes) -> str:
        sig_der = self.private_key.sign(message, ec.ECDSA(hashes.SHA256()))
        r, s = decode_dss_signature(sig_der)
        return b64url(r.to_bytes(32, "big") + s.to_bytes(32, "big"))


def issue_sdjwt_credential(
    *,
    issuer_url: str,
    claims: dict[str, Any],
    holder_cnf: dict[str, Any],
    sd_fields: tuple[str, ...] = ("name", "roll_number", "branch", "enrollment_status", "valid_until"),
) -> str:
    """Issues an authentic SD-JWT with salted disclosures and an ES256 issuer signature."""
    mgr = IssuerKeyManager.get_instance()

    disclosures: list[str] = []
    sd_digests: list[str] = []

    # 1. Create disclosures for selective fields
    for field in sd_fields:
        if field in claims:
            salt = secrets.token_hex(16)
            disc_array = [salt, field, claims[field]]
            disc_b64 = b64url(json.dumps(disc_array, separators=(",", ":")).encode("utf-8"))
            disclosures.append(disc_b64)
            digest = b64url(hashlib.sha256(disc_b64.encode("ascii")).digest())
            sd_digests.append(digest)

    # 2. Build issuer payload
    now = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    payload: dict[str, Any] = {
        "iss": issuer_url,
        "vct": "CampusID",
        "iat": now,
        "nbf": now,
        "cnf": holder_cnf,
        "credential_id": claims.get("credential_id", f"CID-{claims.get('roll_number', 'UNKNOWN')}"),
        "_sd": sd_digests,
        "_sd_alg": "sha-256",
    }
    # Add any non-selective claims directly
    for k, v in claims.items():
        if k not in sd_fields and k != "credential_id":
            payload[k] = v

    # 3. Header with ES256 and x5c certificate
    header = {
        "alg": "ES256",
        "typ": "vc+sd-jwt",
        "x5c": [mgr.cert_b64],
    }

    hdr_b64 = b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    pay_b64 = b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{hdr_b64}.{pay_b64}".encode("ascii")

    sig_b64 = mgr.sign_es256(signing_input)
    base_jwt = f"{hdr_b64}.{pay_b64}.{sig_b64}"

    # Assembled SD-JWT: <Issuer-JWT>~<disclosure1>~<disclosure2>~...~
    return f"{base_jwt}~" + "~".join(disclosures) + "~"
