"""Verifier-side checks for an SD-JWT Campus ID presentation issued by Inji Certify.

Checks: issuer signature (x5c leaf certificate, ES256), disclosures against the signed
`_sd` hashes, holder key binding (KB-JWT), expiry of a disclosed valid_until, and revocation.
"""
import base64
import hashlib
import json
from datetime import date, datetime, timezone

from cryptography import x509
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature


def b64e(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64d(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _es256_verify(token: str, key: ec.EllipticCurvePublicKey) -> None:
    head, payload, sig = token.split(".")
    raw = b64d(sig)
    if len(raw) != 64:
        raise ValueError("bad signature length")
    der = encode_dss_signature(int.from_bytes(raw[:32], "big"), int.from_bytes(raw[32:], "big"))
    key.verify(der, f"{head}.{payload}".encode(), ec.ECDSA(hashes.SHA256()))


def _jwt_parts(token: str) -> tuple[dict, dict]:
    head, payload, _ = token.split(".")
    return json.loads(b64d(head)), json.loads(b64d(payload))


def _holder_key(cnf: dict | str) -> ec.EllipticCurvePublicKey:
    if isinstance(cnf, str):
        if not cnf.startswith("did:jwk:"):
            raise ValueError("holder key is not a did:jwk")
        jwk = json.loads(b64d(cnf[len("did:jwk:"):].split("#")[0]))
    elif isinstance(cnf, dict):
        if "jwk" in cnf:
            jwk = cnf["jwk"]
        elif "kid" in cnf and isinstance(cnf["kid"], str) and cnf["kid"].startswith("did:jwk:"):
            jwk = json.loads(b64d(cnf["kid"][len("did:jwk:"):].split("#")[0]))
        else:
            raise ValueError("unsupported cnf structure")
    else:
        raise ValueError("unsupported cnf type")

    if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256":
        raise ValueError("unsupported holder key type")
    nums = ec.EllipticCurvePublicNumbers(
        int.from_bytes(b64d(jwk["x"]), "big"), int.from_bytes(b64d(jwk["y"]), "big"), ec.SECP256R1()
    )
    return nums.public_key()


def verify_presentation(
    presentation: str,
    *,
    expected_nonce: str,
    expected_aud: str,
    required_claims: list[str] | None = None,
    revoked_ids: set[str] | None = None,
    pin_sha256: str | None = None,
) -> dict:
    """Returns {status: valid|revoked|invalid, reasons, claims, hidden, credential_id, ...}."""
    result: dict = {"status": "invalid", "reasons": [], "claims": {}, "hidden": 0, "credential_id": None,
                    "issuer": None, "issuer_cert_sha256": None}
    fail = result["reasons"].append
    try:
        parts = presentation.split("~")
        if len(parts) < 3 or parts[-1] == "":
            fail("presentation has no key-binding JWT")
            return result
        jwt, disclosures, kb = parts[0], [d for d in parts[1:-1] if d], parts[-1]

        # 1. issuer signature
        head, payload = _jwt_parts(jwt)
        result["issuer"] = payload.get("iss")
        if head.get("alg") != "ES256":
            fail(f"unsupported issuer algorithm {head.get('alg')}")
            return result
        x5c = head.get("x5c")
        if not x5c:
            fail("credential header carries no x5c certificate (header: " + json.dumps(head) + ")")
            return result
        cert = x509.load_der_x509_certificate(base64.b64decode(x5c[0]))
        result["issuer_cert_sha256"] = cert.fingerprint(hashes.SHA256()).hex()
        if pin_sha256 and pin_sha256.lower() != result["issuer_cert_sha256"]:
            fail("issuer certificate does not match the pinned fingerprint")
            return result
        issuer_key = cert.public_key()
        if not isinstance(issuer_key, ec.EllipticCurvePublicKey):
            fail("issuer key is not an EC key")
            return result
        try:
            _es256_verify(jwt, issuer_key)
        except InvalidSignature:
            fail("issuer signature is invalid")
            return result

        # 2. disclosures must match the signed hashes
        signed = set(payload.get("_sd", []))
        claims = {k: v for k, v in payload.items() if k not in ("_sd", "_sd_alg", "cnf", "iss", "vct", "id")}
        seen: set[str] = set()
        for d in disclosures:
            digest = b64e(hashlib.sha256(d.encode()).digest())
            if digest not in signed or digest in seen:
                fail("a disclosed field is not covered by the issuer signature")
                return result
            seen.add(digest)
            salt, name, value = json.loads(b64d(d))
            claims[name] = value
        result["claims"] = claims
        result["hidden"] = len(signed) - len(seen)
        result["credential_id"] = claims.get("credential_id")

        # 3. holder key binding
        kb_head, kb_payload = _jwt_parts(kb)
        if kb_head.get("typ") != "kb+jwt" or kb_head.get("alg") != "ES256":
            fail("key-binding JWT has wrong type or algorithm")
            return result
        cnf = payload.get("cnf")
        if not cnf:
            fail("credential has no cnf confirmation claim for holder key binding")
            return result
        try:
            _es256_verify(kb, _holder_key(cnf))
        except (InvalidSignature, ValueError) as e:
            fail(f"key-binding verification failed: {e}")
            return result
        if kb_payload.get("nonce") != expected_nonce:
            fail("nonce mismatch (possible replay)")
        if kb_payload.get("aud") != expected_aud:
            fail("audience mismatch")
        signed_part = "~".join([jwt, *disclosures]) + "~"
        if kb_payload.get("sd_hash") != b64e(hashlib.sha256(signed_part.encode()).digest()):
            fail("key-binding does not cover exactly the presented fields")
        iat = kb_payload.get("iat")
        if not isinstance(iat, int) or abs(datetime.now(timezone.utc).timestamp() - iat) > 300:
            fail("key-binding JWT is not fresh")

        # 4. server-side required claims enforcement
        if required_claims:
            for rc in required_claims:
                if rc not in claims or claims[rc] is None:
                    fail(f"mandatory requested claim '{rc}' was not disclosed")

        # 5. expiry (only checkable if the holder revealed valid_until)
        vu = claims.get("valid_until")
        if vu:
            try:
                vu_str = str(vu).split("T")[0].strip()
                if date.fromisoformat(vu_str) < date.today():
                    fail(f"credential has expired: valid_until ({vu_str}) is in the past (current system date is {date.today().isoformat()})")
            except Exception:
                fail(f"invalid valid_until date format: {vu}")
        if claims.get("enrollment_status") in ("SUSPENDED",):
            fail("enrollment is suspended")

        if result["reasons"]:
            return result

        # 6. revocation (our own list, keyed on the always-disclosed credential_id)
        cid = claims.get("credential_id")
        if not cid:
            fail("credential has no credential_id")
            return result
        if revoked_ids is not None and cid in revoked_ids:
            result["status"] = "revoked"
            result["reasons"].append("credential has been revoked by the issuer")
            return result
        result["status"] = "valid"
        return result
    except Exception as e:  # malformed input must never crash the verifier
        fail(f"malformed presentation: {type(e).__name__}")
        return result


def build_presentation(credential: str, holder_key_pem: bytes, reveal: list[str], aud: str, nonce: str) -> str:
    """Holder side: keep only the chosen disclosures and sign the key-binding JWT."""
    parts = credential.split("~")
    jwt, disclosures = parts[0], [d for d in parts[1:] if d]
    chosen = [d for d in disclosures if json.loads(b64d(d))[1] in reveal]
    signed_part = "~".join([jwt, *chosen]) + "~"
    key = serialization.load_pem_private_key(holder_key_pem, password=None)
    head = b64e(json.dumps({"alg": "ES256", "typ": "kb+jwt"}).encode())
    body = b64e(json.dumps({
        "iat": int(datetime.now(timezone.utc).timestamp()), "aud": aud, "nonce": nonce,
        "sd_hash": b64e(hashlib.sha256(signed_part.encode()).digest()),
    }).encode())
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    r, s = decode_dss_signature(key.sign(f"{head}.{body}".encode(), ec.ECDSA(hashes.SHA256())))
    return signed_part + f"{head}.{body}." + b64e(r.to_bytes(32, "big") + s.to_bytes(32, "big"))
