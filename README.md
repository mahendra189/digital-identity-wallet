# digital-identity-wallet
A privacy-first digital identity wallet for issuing, storing, and verifying verifiable credentials, inspired by Inji Wallet, Multipaz, and EUDI Wallet standards.

## Security upgrades
This project now includes a stronger wallet security model that uses:

- A double-handshake challenge/response process before a wallet session is trusted.
- A layered encryption protocol that wraps payloads through device, vault, and transport keys.
- Per-layer nonce handling and key derivation so a single compromised layer does not expose the full credential record.
- A secure session key to protect credential exchange and storage.

## Example usage
```python
from digital_identity_wallet.security import SecureWallet

wallet = SecureWallet("shared-wallet-secret", device_id="wallet-01", issuer_id="issuer-01")
challenge = wallet.start_handshake()
response = wallet.issuer_response(challenge["nonce"])
wallet.complete_handshake(response, challenge["nonce"])

envelope = wallet.secure({"vc": "did:example:credential-1", "status": "verified"})
print(wallet.open(envelope))

expected_ids = ["credential-1", "credential-2"]
fetched_documents = [
    {"id": "credential-1", "claims": {"name": "Alice"}},
    {"id": "credential-2", "claims": {"name": "Bob"}},
]
receipt = wallet.create_document_fetch_receipt(fetched_documents, expected_ids)
assert wallet.verify_document_fetch_receipt(receipt, fetched_documents, expected_ids)
```

The fetch receipt is only issued after the verified double-handshake session is active and every expected document is present exactly once. It contains document IDs and SHA-256 hashes, not document contents, and is signed with the session key. Verification checks the complete batch and detects document tampering. The caller must pass the IDs it expected to fetch; this API attests to the supplied fetched batch but does not itself retrieve documents from a remote service.

The layered protocol is designed to add a second trust boundary and multiple encryption layers before data leaves the wallet.
