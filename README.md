# Digital Identity Wallet (Campus ID)

A privacy-first, standards-compliant Digital Identity Wallet ecosystem for issuing, securely holding, and selectively presenting verifiable credentials. Inspired by the MOSIP Inji ecosystem (Inji Certify, Inji Verify, Inji Wallet) and W3C/OIDC identity standards (W3C Verifiable Credentials 2.0, OpenID4VCI, OpenID4VP, and IETF SD-JWT RFC 9537).

---

## 1. System Architecture

The platform implements the classic three-party decentralized trust model across three integrated subsystems:

```text
                           +------------------------------+
                           |  Issuer Admin Portal (:8000) |
                           +------------------------------+
                                          |
                                          | POST /api/v1/credentials/issue
                                          v
                           +------------------------------+
                           |  FastAPI Backend (:8000)     |
                           |  - OpenID4VCI Issuer Service |
                           |  - Status List & Revocation  |
                           |  - RFC 7519 JWT Auth (Admin) |
                           +------------------------------+
                                          |
                        OpenID4VCI Offer  |  Credential Issuance
                        (Pre-Auth Code)   |  (ES256 SD-JWT + x5c)
                                          v
                           +------------------------------+
                           |  Holder Web Wallet (:3002)   |
                           |  - React + TypeScript        |
                           |  - WebCrypto P-256 Key Vault |
                           |  - Selective Disclosure UI   |
                           |  - OpenID4VP Presentation    |
                           +------------------------------+
                                          |
                        OpenID4VP Request |  SD-JWT Presentation
                        (Nonce, ClientID) |  with Key-Binding JWT
                                          v
                           +------------------------------+
                           |  Verifier Portal (:8000)     |
                           |  - Verification Endpoint     |
                           |  - Signature & Trust Pinning |
                           |  - Revocation Status Check   |
                           +------------------------------+
```

### Components

1. **FastAPI Backend (`/backend`)**:
   - Standard RFC 7519 JWT authentication with role-based authorization (`admin`, `verifier`).
   - OpenID4VCI issuance service (`/.well-known/openid-credential-issuer`, `/api/v1/issuer/token`, `/api/v1/issuer/credential`).
   - OpenID4VP presentation verification engine (`/api/v1/verify`, `/api/v1/presentation-requests`).
   - Revocation tracking and Bitstring Status List management (`/api/v1/revocations`).
   - Privacy-preserving audit logging (`/api/v1/audit`).
   - Database persistence via SQLAlchemy with SQLite (development/tests) and PostgreSQL (production).

2. **Web Holder Wallet (`/wallet`)**:
   - Modern React 18 + TypeScript + Tailwind CSS application.
   - Hardware-aligned cryptographic key custody using Web Crypto API (`ECDSA P-256`) and IndexedDB.
   - Real OpenID4VCI pre-authorized code claim exchange with proof-of-possession signing.
   - Holder-controlled consent screen for attribute-level selective disclosure.
   - Real SD-JWT Key-Binding (`kb+jwt`) assembly and direct HTTP presentation submission.
   - On-device audit log and presentation history.

3. **Portals (`/portals`)**:
   - **Issuer Admin Portal** (`http://localhost:8000/admin`): Student enrollment, OpenID4VCI offer generation, credential registry, and revocation.
   - **Verifier Portal** (`http://localhost:8000/verifier`): OpenID4VP challenge generation, presentation inspection, cryptographic signature validation, and revocation detection.

---

## 2. Quick Start & Local Development

### Prerequisites
- Python 3.11+ (or conda environment `ml`)
- Node.js 20+ and `pnpm` (or `npm`)
- Docker & Docker Compose (optional, for full containerized stack)

### Option A: Local Native Development (Recommended)

#### 1. Start the Backend
```bash
# From repository root
cd backend

# Configure environment
cp ../.env.example .env

# Run migrations & seed accounts
python -m app.migrate

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend is now live at:
- **API & Swagger Docs:** `http://localhost:8000/docs`
- **Issuer Admin Portal:** `http://localhost:8000/admin/` (Login: `admin` / `admin123`)
- **Verifier Portal:** `http://localhost:8000/verifier/` (Login: `verifier` / `verifier123`)
- **OpenID4VCI Metadata:** `http://localhost:8000/.well-known/openid-credential-issuer`

#### 2. Start the Holder Wallet
```bash
# In a separate terminal
cd wallet

# Install dependencies (if not already installed)
pnpm install

# Start Vite development server
pnpm run dev
```

The wallet is now accessible at `http://localhost:3002/`.

---

### Option B: Docker Compose

To start the full stack including PostgreSQL:
```bash
docker compose up -d --build
```
Access points:
- Holder Wallet: `http://localhost:3002/`
- Issuer Admin: `http://localhost:8000/admin/`
- Verifier Portal: `http://localhost:8000/verifier/`

---

## 3. End-to-End Walkthrough

### Step 1: Issue a Campus ID
1. Navigate to the **Issuer Admin Portal** at `http://localhost:8000/admin/`.
2. Log in with `admin` / `admin123`.
3. Under **Issue a Campus ID**, enter student details (e.g., Name: `Priya Sharma`, Roll: `21CS042`, Branch: `Computer Science`, Valid Until: `2028-06-30`).
4. Click **Issue**. Copy the generated `openid-credential-offer://` link or QR code.

### Step 2: Claim the Credential in Holder Wallet
1. Open the **Holder Wallet** at `http://localhost:3002/`.
2. Click **Verify or Scan QR** (or paste the offer link in the scanner modal).
3. The wallet contacts the issuer, exchanges the pre-authorized code, signs a proof-of-possession JWT using its WebCrypto P-256 private key, receives the genuinely signed SD-JWT, and stores it in the secure vault.
4. The **Campus ID Card** appears immediately on the dashboard.

### Step 3: Present with Selective Disclosure
1. Open the **Verifier Portal** at `http://localhost:8000/verifier/`.
2. Log in with `verifier` / `verifier123`.
3. Under **Ask the student to share**, click **Generate OpenID4VP request** and copy the generated link.
4. In the **Holder Wallet**, click **Verify or Scan QR** and paste the verifier request.
5. The **Sharing Consent Modal** appears:
   - Required claims (`enrollment_status`, `valid_until`) are mandatory.
   - Optional claims (`name`, `roll_number`, `branch`) can be toggled on/off.
   - Untoggle `name` and `roll_number`.
6. Click **Authorize & Present Proof**. The wallet computes the SD-JWT with cryptographic Key-Binding (`kb+jwt`) and submits the presentation to the verifier.

### Step 4: Verify Proof & Revocation
1. The Verifier Portal displays **VALID**:
   - Validates the issuer's ES256 x5c certificate and signature.
   - Validates that disclosed fields match the signed `_sd` hashes.
   - Validates the holder's key-binding signature and freshness.
   - Notes that `name` and `roll_number` were withheld.
2. Return to the **Issuer Admin Portal** and click **Revoke** on `CID-21CS042`.
3. Repeat presentation in the wallet: the verifier immediately rejects the credential with **REVOKED**.

---

## 4. Testing & Verification

### Running the Wallet Test Suite
```bash
cd wallet
pnpm test
```
Verifies:
- Attribute omission in selective disclosure presentation tokens.
- Full disclosure scenarios.
- Zero disclosure scenarios.
- OpenID4VP parameter parsing.
- Cryptographic `sd_hash` calculation and Key-Binding JWT assembly.
- OpenID4VCI offer ingestion.

### Running the Backend Test Suite
```bash
cd backend
pytest -v
```
Verifies:
- Standard RFC 7519 JWT creation, expiration, invalid signatures, revoked JTIs.
- OWASP PBKDF2-HMAC-SHA256 password hashing.
- Brute-force rate limiting.
- Role-based authorization (`admin` vs `verifier`).
- OpenID4VCI discovery, token exchange, and credential issuance.
- OpenID4VP challenge generation, nonce replay prevention, required claim enforcement, and revocation checking.
- Cryptographic negative tests (tampered claims, fabricated disclosures, wrong nonces, expired credentials, holder key mismatches).

---

## 5. Security & Operational Checklist for Production

- [ ] **Secrets Management**: Set `ENVIRONMENT=production` and generate a high-entropy secret of at least 32 characters for `SECRET_KEY`.
- [ ] **Credentials**: Remove default admin/verifier passwords and provision accounts via environment variables or secure CLI.
- [ ] **HTTPS/TLS**: Deploy all portals and APIs behind TLS termination (reverse proxy or cloud load balancer).
- [ ] **Certificate Trust**: Configure `ISSUER_CERT_SHA256` to pin the issuer's root certificate fingerprint.
- [ ] **CORS**: Restrict `CORS_ORIGINS` to trusted portal domains.
- [ ] **Status Lists**: Ensure status lists and revocation endpoints have redundancy and low cache TTLs.
