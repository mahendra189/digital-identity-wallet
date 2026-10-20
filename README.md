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
```

The layered protocol is designed to be easy to reason about while still adding a second trust boundary and multiple encryption layers before data leaves the wallet.
