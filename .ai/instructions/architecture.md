# Architectural Invariants & Stack Constraints

This document outlines non-negotiable architectural rules for the **Campus ID on MOSIP Inji stack** project.

---

## 1. Domain & Technology Stack

- **Stack Framework:** MOSIP Inji Ecosystem (`Inji Certify`, `Inji Verify`, `Inji Wallet`).
- **Issuance Protocol:** OpenID4VCI (OpenID for Verifiable Credential Issuance).
- **Verification Protocol:** OpenID4VP (OpenID for Verifiable Presentations).
- **Credential Format:** SD-JWT (Selective Disclosure JWT) to support field-level disclosure.
- **Revocation Standard:** W3C Status List / Bitstring Status List served by the issuer.
- **Issuer / Verifier Web Stack:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend API:** FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy / asyncpg, PostgreSQL.
- **Mobile Stack:** Inji Wallet fork (React Native, TypeScript, Android targeting SDK 34+).

---

## 2. Invariants

1. **No Centralized Credential Storage:**
   - The college database (PostgreSQL) stores **only** student records, issuance logs, and revocation status lists.
   - The plain credential content is never retained in backend databases after issuance.
2. **Selective Disclosure Default:**
   - The mobile wallet presentation flow must require explicit holder consent for each requested claim.
   - If a verifier only asks for `enrollment_status`, the wallet must not disclose `roll_number` or `name` unless explicitly toggled on by the holder.
3. **Decoupled Team Slices:**
   - Team 1 (Issuer & Verifier) must remain testable using stock Inji tools or mock test clients.
   - Team 2 (Wallet) must remain testable against Inji demo issuers or local Docker mock services.
