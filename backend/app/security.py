import base64
import hashlib
import hmac
import json
import secrets
import time
from collections import defaultdict
from typing import Any

from app.config import settings

# In-memory blacklist for revoked token JTIs / sessions
REVOKED_JTIS: set[str] = set()

# In-memory rate limiting tracker: IP/username -> list of timestamps
FAILED_LOGIN_ATTEMPTS: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 300  # 5 minutes
MAX_FAILED_ATTEMPTS = 5


def hash_password(password: str, salt: bytes | None = None, iterations: int = 600_000) -> str:
    """Hashes passwords using PBKDF2-HMAC-SHA256 with 600,000 iterations (OWASP standard)."""
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{salt.hex()}${iterations}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Verifies a password hash, supporting both current and legacy formats."""
    parts = stored.split("$")
    if len(parts) == 3:
        salt_hex, iter_str, dk_hex = parts
        iterations = int(iter_str)
    elif len(parts) == 2:
        salt_hex, dk_hex = parts
        iterations = 200_000  # legacy compatibility
    else:
        return False
    salt = bytes.fromhex(salt_hex)
    candidate_dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(candidate_dk.hex(), dk_hex)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(username: str, role: str) -> str:
    """Creates a standard RFC 7519 JSON Web Token (JWT) with HS256 signature."""
    now = int(time.time())
    header = {"typ": "JWT", "alg": "HS256"}
    payload: dict[str, Any] = {
        "sub": username,
        "role": role,
        "iss": settings.token_issuer,
        "aud": settings.token_audience,
        "iat": now,
        "exp": now + settings.token_ttl_seconds,
        "jti": secrets.token_hex(16),
    }

    hdr_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    pay_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{hdr_b64}.{pay_b64}".encode("ascii")

    sig = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)

    return f"{hdr_b64}.{pay_b64}.{sig_b64}"


def decode_token(token: str) -> dict[str, Any] | None:
    """Validates and decodes a standard RFC 7519 JWT, verifying signature, expiry, and claims."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        hdr_b64, pay_b64, sig_b64 = parts

        header = json.loads(_b64url_decode(hdr_b64))
        if header.get("typ") != "JWT" or header.get("alg") != "HS256":
            return None

        signing_input = f"{hdr_b64}.{pay_b64}".encode("ascii")
        expected_sig = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
        provided_sig = _b64url_decode(sig_b64)

        if not hmac.compare_digest(provided_sig, expected_sig):
            return None

        payload = json.loads(_b64url_decode(pay_b64))
        now = time.time()

        if payload.get("exp", 0) <= now:
            return None

        if payload.get("iss") != settings.token_issuer:
            return None

        if payload.get("aud") != settings.token_audience:
            return None

        jti = payload.get("jti")
        if jti and jti in REVOKED_JTIS:
            return None

        return payload
    except Exception:
        return None


def revoke_token(jti: str) -> None:
    """Revokes a token session by adding its JTI to the revoked set."""
    REVOKED_JTIS.add(jti)


def check_rate_limit(key: str) -> bool:
    """Returns True if the request is permitted, False if rate limited."""
    now = time.time()
    attempts = [t for t in FAILED_LOGIN_ATTEMPTS[key] if now - t < RATE_LIMIT_WINDOW]
    FAILED_LOGIN_ATTEMPTS[key] = attempts
    return len(attempts) < MAX_FAILED_ATTEMPTS


def record_failed_attempt(key: str) -> None:
    """Records a failed login attempt for brute-force protection."""
    FAILED_LOGIN_ATTEMPTS[key].append(time.time())


def clear_failed_attempts(key: str) -> None:
    """Resets failed login attempts after successful authentication."""
    FAILED_LOGIN_ATTEMPTS.pop(key, None)

