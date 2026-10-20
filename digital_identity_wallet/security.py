from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Set

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except Exception:  # pragma: no cover - optional dependency
    AESGCM = None


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def _to_bytes(value: Any) -> bytes:
    if isinstance(value, bytes):
        return value
    if isinstance(value, bytearray):
        return bytes(value)
    if isinstance(value, str):
        return value.encode("utf-8")
    return json.dumps(value, sort_keys=True).encode("utf-8")


def _canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")


class DoubleHandshake:
    """Mutual challenge-response handshake with signed receipts and anti-replay tracking."""

    def __init__(self, device_id: str, issuer_id: str, shared_secret: str):
        self.device_id = device_id
        self.issuer_id = issuer_id
        self.shared_secret = shared_secret
        self.client_nonce: str | None = None
        self.server_nonce: str | None = None
        self.session_key: bytes | None = None
        self.used_nonces: Set[str] = set()
        self.receipts: List[Dict[str, Any]] = []

    def _receipt(self, event: str, metadata: Dict[str, Any], key: bytes) -> Dict[str, Any]:
        body = {"event": event, "timestamp": int(time.time()), "metadata": metadata}
        digest = hashlib.sha256(_canonical_json(body)).hexdigest()
        signature = hmac.new(key, _canonical_json(body), hashlib.sha256).hexdigest()
        return {"event": event, "digest": digest, "signature": signature, "timestamp": body["timestamp"]}

    def initiate(self) -> Dict[str, Any]:
        self.client_nonce = secrets.token_hex(16)
        challenge = {
            "device_id": self.device_id,
            "issuer_id": self.issuer_id,
            "nonce": self.client_nonce,
            "step": "init",
            "timestamp": int(time.time()),
        }
        receipt = self._receipt("handshake_init", challenge, self.shared_secret.encode("utf-8"))
        self.receipts.append(receipt)
        challenge["receipt"] = receipt
        return challenge

    def respond(self, client_nonce: str) -> Dict[str, Any]:
        if client_nonce is None:
            raise ValueError("A client nonce is required for the server response.")
        if client_nonce in self.used_nonces:
            raise ValueError("Replay detected: client nonce already used.")
        self.used_nonces.add(client_nonce)

        self.server_nonce = secrets.token_hex(16)
        session_material = f"{self.shared_secret}:{self.device_id}:{self.issuer_id}:{client_nonce}:{self.server_nonce}"
        self.session_key = hashlib.sha256(session_material.encode("utf-8")).digest()

        proof = hmac.new(
            self.session_key,
            f"{self.device_id}:{self.issuer_id}:{client_nonce}:{self.server_nonce}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        response = {
            "device_id": self.device_id,
            "issuer_id": self.issuer_id,
            "step": "response",
            "nonce": self.server_nonce,
            "proof": proof,
            "timestamp": int(time.time()),
        }
        receipt = self._receipt("handshake_response", response, self.session_key)
        self.receipts.append(receipt)
        response["receipt"] = receipt
        return response

    def verify_response(self, response: Dict[str, Any], client_nonce: str) -> bytes:
        if response.get("step") != "response":
            raise ValueError("The response step is invalid.")
        if response.get("nonce") != self.server_nonce:
            raise ValueError("The server nonce does not match the expected exchange.")

        expected_proof = hmac.new(
            self.session_key or b"",
            f"{self.device_id}:{self.issuer_id}:{client_nonce}:{response['nonce']}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(response.get("proof", ""), expected_proof):
            raise ValueError("The handshake proof is invalid.")

        if "receipt" in response:
            receipt = response["receipt"]
            body = {"event": receipt["event"], "timestamp": receipt["timestamp"], "metadata": {k: v for k, v in response.items() if k != "receipt"}}
            expected_signature = hmac.new(self.session_key or b"", _canonical_json(body), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(receipt.get("signature", ""), expected_signature):
                raise ValueError("The signature attached to the handshake receipt is invalid.")

        final_receipt = self._receipt(
            "handshake_verified",
            {"device_id": self.device_id, "issuer_id": self.issuer_id, "client_nonce": client_nonce, "server_nonce": self.server_nonce},
            self.session_key or b"",
        )
        self.receipts.append(final_receipt)
        return self.session_key or b""


class LayeredProtocol:
    """Encrypts payloads with multiple keys and keeps a signed receipt chain."""

    def __init__(self, master_secret: str, layers: Iterable[str] = ("device", "credential_vault", "transport")):
        self.master_secret = master_secret
        self.layers = list(layers)
        self.session_key: bytes | None = None
        self.seen_envelope_ids: Set[str] = set()

    def set_session_key(self, session_key: bytes | str) -> None:
        if isinstance(session_key, str):
            session_key = bytes.fromhex(session_key)
        self.session_key = session_key

    def _signature_key(self) -> bytes:
        if self.session_key is None:
            return self.master_secret.encode("utf-8")
        return self.session_key

    def _derive_layer_key(self, layer_name: str, salt: bytes) -> bytes:
        base_seed = (self.session_key.hex() if self.session_key else self.master_secret).encode("utf-8")
        material = base_seed + b":" + layer_name.encode("utf-8") + salt
        return hashlib.pbkdf2_hmac("sha256", material, b"wallet-layered-protocol", 200_000, dklen=32)

    @staticmethod
    def _xor_stream(key: bytes, payload_length: int, nonce: bytes) -> bytes:
        stream = bytearray()
        for index in range(payload_length):
            stream.append(key[(index + nonce[index % len(nonce)]) % len(key)] ^ nonce[index % len(nonce)])
        return bytes(stream)

    @staticmethod
    def _encrypt_fallback(secret_key: bytes, payload: bytes, nonce: bytes) -> bytes:
        keystream = LayeredProtocol._xor_stream(secret_key, len(payload), nonce)
        return bytes(a ^ b for a, b in zip(payload, keystream))

    @staticmethod
    def _decrypt_fallback(secret_key: bytes, payload: bytes, nonce: bytes) -> bytes:
        return LayeredProtocol._encrypt_fallback(secret_key, payload, nonce)

    def _encrypt_segment(self, layer_name: str, payload: bytes) -> Dict[str, str]:
        nonce = secrets.token_bytes(12)
        salt = hashlib.sha256(f"{layer_name}:{self.master_secret}".encode("utf-8")).digest()
        key = self._derive_layer_key(layer_name, salt)

        if AESGCM is not None:
            cipher = AESGCM(key)
            ciphertext = cipher.encrypt(nonce, payload, None)
        else:
            ciphertext = self._encrypt_fallback(key, payload, nonce)

        return {
            "layer": layer_name,
            "nonce": _b64encode(nonce),
            "ciphertext": _b64encode(ciphertext),
        }

    def _decrypt_segment(self, layer_name: str, segment: Dict[str, str]) -> bytes:
        salt = hashlib.sha256(f"{layer_name}:{self.master_secret}".encode("utf-8")).digest()
        key = self._derive_layer_key(layer_name, salt)
        nonce = _b64decode(segment["nonce"])
        payload = _b64decode(segment["ciphertext"])

        if AESGCM is not None:
            return AESGCM(key).decrypt(nonce, payload, None)
        return self._decrypt_fallback(key, payload, nonce)

    def _make_receipt(self, event: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        body = {"event": event, "timestamp": int(time.time()), "metadata": metadata}
        digest = hashlib.sha256(_canonical_json(body)).hexdigest()
        signature = hmac.new(self._signature_key(), _canonical_json(body), hashlib.sha256).hexdigest()
        return {"event": event, "digest": digest, "signature": signature, "timestamp": body["timestamp"]}

    def _verify_receipt(self, receipt: Dict[str, Any], metadata: Dict[str, Any]) -> None:
        if not isinstance(receipt, dict):
            raise ValueError("The receipt must be an object.")

        expected_body = {"event": receipt.get("event"), "timestamp": receipt.get("timestamp"), "metadata": metadata}
        expected_signature = hmac.new(self._signature_key(), _canonical_json(expected_body), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(receipt.get("signature", ""), expected_signature):
            raise ValueError("Receipt signature mismatch.")

    def encrypt(self, data: Any) -> Dict[str, Any]:
        if self.session_key is None:
            raise ValueError("A session key must be established before encrypting wallet data.")

        payload = _to_bytes(data)
        payload_hash = hashlib.sha256(payload).hexdigest()
        segments: List[Dict[str, str]] = []
        working = payload

        for layer_name in self.layers:
            segment = self._encrypt_segment(layer_name, working)
            segments.append(segment)
            working = _b64decode(segment["ciphertext"])

        ts = int(time.time())
        envelope_id = secrets.token_hex(16)
        body = {
            "version": "double-handshake-v1",
            "envelope_id": envelope_id,
            "timestamp": ts,
            "payload_hash": payload_hash,
            "layers": self.layers,
            "segments": segments,
        }
        receipt = self._make_receipt("payload_encrypted", body)
        receipt_chain = [receipt]
        receipt_chain.append(self._make_receipt("payload_verified", {"envelope_id": envelope_id, "payload_hash": payload_hash}))
        return {
            "version": "double-handshake-v1",
            "envelope_id": envelope_id,
            "timestamp": ts,
            "payload_hash": payload_hash,
            "layers": self.layers,
            "segments": segments,
            "receipt": receipt,
            "receipts": receipt_chain,
        }

    def decrypt(self, envelope: Dict[str, Any]) -> Any:
        if self.session_key is None:
            raise ValueError("Session encryption must be active before decrypting wallet data.")

        envelope_id = envelope.get("envelope_id")
        if envelope_id in self.seen_envelope_ids:
            raise ValueError("Replay detected: envelope already processed.")
        self.seen_envelope_ids.add(envelope_id)

        ts = envelope.get("timestamp")
        if isinstance(ts, (int, float)) and abs(int(time.time()) - int(ts)) > 300:
            raise ValueError("Expired wallet envelope detected.")

        receipt = envelope.get("receipt")
        if receipt is None:
            raise ValueError("The wallet envelope has no security receipt.")
        self._verify_receipt(receipt, {k: v for k, v in envelope.items() if k not in {"receipt", "receipts"}})

        segments = envelope.get("segments", [])
        if not segments:
            raise ValueError("The envelope does not contain encrypted segments.")

        working = _b64decode(segments[-1]["ciphertext"])
        for segment in reversed(segments):
            working = self._decrypt_segment(segment["layer"], segment)

        try:
            parsed = json.loads(working.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            parsed = working.decode("utf-8", errors="replace")

        verification_receipt = self._make_receipt(
            "payload_decrypted",
            {"envelope_id": envelope_id, "payload_hash": envelope.get("payload_hash"), "status": "verified"},
        )
        envelope["verification_receipt"] = verification_receipt
        return parsed


@dataclass
class SecureWallet:
    master_secret: str
    device_id: str = "wallet-device"
    issuer_id: str = "issuer"

    def __post_init__(self) -> None:
        self.handshake = DoubleHandshake(self.device_id, self.issuer_id, self.master_secret)
        self.protocol = LayeredProtocol(self.master_secret)

    def start_handshake(self) -> Dict[str, Any]:
        return self.handshake.initiate()

    def issuer_response(self, client_nonce: str) -> Dict[str, Any]:
        return self.handshake.respond(client_nonce)

    def complete_handshake(self, response: Dict[str, Any], client_nonce: str) -> bytes:
        session_key = self.handshake.verify_response(response, client_nonce)
        self.protocol.set_session_key(session_key)
        return session_key

    def secure(self, payload: Any) -> Dict[str, Any]:
        return self.protocol.encrypt(payload)

    def open(self, envelope: Dict[str, Any]) -> Any:
        return self.protocol.decrypt(envelope)
