# Team 1: Issuer and Verifier Work Tracking

> **Reference Document:** [`.context/team-split.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.context/team-split.md)  
> **Goal:** A college can issue, verify, and revoke a campus ID without needing our custom wallet.  
> **Current Status:** 🟡 Not Started (`0%`)

---

## Member Assignment & Work Breakdown

### Member 1 (Kislay): Inji Certify, Schema, Issuing, Revocation & Status List

- [ ] **M1.1: Inji Certify Local Deployment**
  - Clone and set up Inji Certify locally using Docker Compose from the official repository.
  - Verify container health and expose OpenID4VCI endpoints.
- [ ] **M1.2: Campus ID Credential Schema & SD-JWT Configuration**
  - Define Campus ID schema with attributes: `name`, `roll_number`, `branch`, `enrollment_status`, `valid_until`, `photo` (optional).
  - Configure SD-JWT format in Certify to allow field-level disclosure.
  - Set up cryptographic signing keys.
- [ ] **M1.3: Mock Student Authentication & Issuance Flow**
  - Implement mock student login for credential claiming.
  - Test issuing credentials via OpenID4VCI.
- [ ] **M1.4: Revocation & Status List Publication**
  - Implement revocation mechanism: mark credential revoked.
  - Publish status list (Status List 2021 / Bitstring Status List) accessible to verifiers.

---

### Member 2: Inji Verify, Issuer & Verifier Portals, API & Database

- [ ] **M2.1: Inji Verify Local Deployment & Configuration**
  - Clone and set up Inji Verify locally using Docker Compose from the official repository.
  - Configure Verify to read Certify's published status list and accurately display "Revoked" when tested.
- [ ] **M2.2: FastAPI Backend & PostgreSQL Database**
  - Scaffold FastAPI project with PostgreSQL.
  - Database schema for:
    - User/Admin accounts
    - Audit logs
    - Revoked-ID list
  - **Constraint:** Strictly NO credential content is stored in the database.
  - REST endpoints for admin issuance trigger, revocation trigger, and verifier session status.
- [ ] **M2.3: Issuer Admin Web Portal (Next.js)**
  - Simple, responsive UI for college admin.
  - Issue Campus ID interface (triggers issuance & displays QR / link for wallet).
  - Revoke Campus ID action with student/credential lookup.
- [ ] **M2.4: Verifier Web Portal (Next.js)**
  - Verification interface displaying OpenID4VP request QR code.
  - Real-time result view showing status (Valid / Revoked) and verified fields.

---

## Standalone Demo 1 Checklist (No custom wallet needed)
*Stand-in for wallet: Stock unmodified Inji Wallet or a test client.*

- [ ] 1. College admin logs into Admin Portal.
- [ ] 2. Admin issues a Campus ID.
- [ ] 3. Stock Inji Wallet (or test client) receives the credential.
- [ ] 4. Verifier portal checks the credential and shows **Valid**.
- [ ] 5. Admin revokes the credential via Admin Portal.
- [ ] 6. Verifier portal checks again and shows **Revoked**.
