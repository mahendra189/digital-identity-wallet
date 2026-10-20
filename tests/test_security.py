import json

from digital_identity_wallet.security import DoubleHandshake, LayeredProtocol


def test_double_handshake_round_trip() -> None:
    handshake = DoubleHandshake("wallet-device", "issuer-portal", "master-secret")
    challenge = handshake.initiate()

    response = handshake.respond(challenge["nonce"])
    session_key = handshake.verify_response(response, challenge["nonce"])

    assert challenge["step"] == "init"
    assert challenge["receipt"]["event"] == "handshake_init"
    assert response["step"] == "response"
    assert response["receipt"]["event"] == "handshake_response"
    assert len(session_key) == 32
    assert response["proof"]


def test_layered_protocol_round_trip() -> None:
    protocol = LayeredProtocol("master-secret")
    protocol.set_session_key("0123456789abcdef0123456789abcdef")

    payload = {"issuer": "Acme", "credential": "wallet-credential-42", "claims": {"name": "Jane Doe"}}
    envelope = protocol.encrypt(payload)
    restored = protocol.decrypt(envelope)

    assert envelope["version"] == "double-handshake-v1"
    assert envelope["segments"]
    assert envelope["receipt"]["event"] == "payload_encrypted"
    assert envelope["receipts"][0]["event"] == "payload_encrypted"
    assert restored == payload


def test_secure_wallet_protects_payloads() -> None:
    from digital_identity_wallet.security import SecureWallet

    wallet = SecureWallet("shared-wallet-secret", device_id="wallet-01", issuer_id="issuer-01")
    challenge = wallet.start_handshake()
    response = wallet.issuer_response(challenge["nonce"])
    wallet.complete_handshake(response, challenge["nonce"])

    envelope = wallet.secure({"vc": "did:example:credential-1", "status": "verified"})
    assert wallet.open(envelope) == {"vc": "did:example:credential-1", "status": "verified"}

    try:
        wallet.open(envelope)
        assert False, "Replay should have been rejected."
    except ValueError:
        pass
