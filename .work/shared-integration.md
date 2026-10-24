# Joint Integration Track & Verification

**Assigned Members:** All (Members 1, 2, 3, 4)  
**Current Milestone:** Milestone 3.4 — Tampering & Security Negative Tests  
**Current Status:** 🟢 Completed (`100%`)

---

## 1. Integration Scope

This track covers the convergence of Team 1's Issuer/Verifier backend and Team 2's Holder Wallet into a unified, live end-to-end demonstration.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as College Admin (Team 1)
    actor Student as Student Holder (Team 2)
    actor Verifier as Campus Verifier (Team 1)

    participant IssuerPortal as Issuer Portal
    participant API as FastAPI / Inji Certify
    participant Wallet as Web Holder Wallet
    participant VerifyAPI as Inji Verify / Verifier Portal

    Admin->>IssuerPortal: Enrolls student & clicks "Issue Campus ID"
    IssuerPortal->>API: POST /issue-offer (SD-JWT)
    API-->>IssuerPortal: QR Code (OpenID4VCI Offer)
    Student->>Wallet: Scans QR Code
    Wallet->>API: Exchanges offer for signed SD-JWT Credential
    API-->>Wallet: Returns signed Campus ID
    Wallet-->>Student: Displays Campus ID Card

    Verifier->>VerifyAPI: Requests proof of enrollment (OpenID4VP)
    VerifyAPI-->>Verifier: Displays Presentation QR Code
    Student->>Wallet: Scans Verifier QR Code
    Wallet-->>Student: Shows Consent Screen with field toggles
    Student->>Wallet: Toggles off Roll Number & submits
    Wallet->>VerifyAPI: Posts selectively disclosed SD-JWT presentation
    VerifyAPI-->>Verifier: Displays "VALID" with selected attributes only

    Admin->>IssuerPortal: Clicks "Revoke Credential"
    IssuerPortal->>API: Updates Status List
    Student->>Wallet: Presents credential again to Verifier
    Wallet->>VerifyAPI: Submits presentation
    VerifyAPI-->>Verifier: Rejects presentation with "REVOKED"
```

---

## 2. Integration Milestones & Checklists

### 3.1 Contract & Schema Harmonization
- [x] Confirm exact claim keys across Issuer, Wallet, and Verifier (`name`, `roll_number`, `branch`, `enrollment_status`, `valid_until`, `credential_id`).
- [x] Align SD-JWT disclosure framing: ensure salt generation in Certify/Issuer matches disclosure extraction in Wallet.
- [x] Verify OpenID4VCI and OpenID4VP request/response payloads meet spec.

### 3.2 Network Configuration & Port Mapping
- [x] Localhost / Docker port assignments defined without collision:
  - `3002`: Web Holder Wallet (React / Vite)
  - `8000`: FastAPI Backend Service (API + Admin & Verifier Static Portals)
  - `8080` / `8090`: Inji Certify (Docker)
  - `5432`: PostgreSQL
- [x] CORS policies properly configured between web portals and APIs.

### 3.3 End-to-End Workflow Verification
- [x] Full positive issuance flow: Admin issue -> Wallet claim.
- [x] Full positive presentation flow: Verifier scan -> Consent -> Presentation valid.
- [x] Selective disclosure verification: Ensure undisclosed claims cannot be reconstructed by Verifier.
- [x] Revocation verification: Admin revoke -> Verifier scan shows "REVOKED".

### 3.4 Tampering & Security Negative Tests
- [x] Tampered claim payload test: Verifier detects signature mismatch.
- [x] Expired credential test: Verifier flags `valid_until` in the past.
- [x] Untrusted issuer test: Verifier rejects credential signed by unknown key.
- [x] Holder rejection test: Wallet cancels presentation safely without leaking data.

