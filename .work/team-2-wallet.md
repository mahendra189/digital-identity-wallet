# Team 2: Holder Web Wallet Work Tracking

> **Reference Documents:** [`.context/problem-statement.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.context/problem-statement.md), [`.context/team-split.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.context/team-split.md), [ADR-003](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.ai/records/decisions.md#adr-003-react-web-based-holder-wallet-implementation)  
> **Goal:** A student receives a campus ID in the web-based Digital Identity Wallet and chooses exactly which fields to share.  
> **Current Status:** 🟢 Completed (`100%`)

---

## Technical Foundation: React / Next.js Web Wallet
- **Platform:** React (Vite) with TypeScript and Tailwind CSS.
- **Client Storage:** Client-side encrypted local vault (no central server storing credentials).
- **Protocols:** OpenID4VCI (issuance receipt) & OpenID4VP (presentation) with SD-JWT selective disclosure.

---

## Member Assignment & Work Breakdown

### Member 3: Web Wallet Scaffold, Credential Ingestion & Campus ID Card Display

- [x] **M3.1: React Web Wallet Project Scaffolding**
  - Scaffold React web application under `wallet/` with Vite, TypeScript, Tailwind CSS, Lucide icons.
  - Setup client-side secure vault service (`src/services/storage.ts`).
- [x] **M3.2: OpenID4VCI Credential Ingestion & Storage**
  - Web QR code scanner & manual offer input (`src/components/QRScannerModal.tsx`).
  - OpenID4VCI client service (`src/services/openid4vci.ts`) to ingest offers and claim signed Campus ID.
  - Client-side vault persistence.
- [x] **M3.3: Campus ID Card Visual Component**
  - Realistic college ID card component (`src/components/CampusIdCard.tsx`) with college header, verified shield, roll number, branch, status pill, and validity date.
  - Detail inspection modal (`src/components/CredentialDetailModal.tsx`) showing SD-JWT algorithm, issuer DID, status list index, and raw disclosures.

---

### Member 4: Sharing Flow, Per-Field Consent Screen, Local History

- [x] **M4.1: OpenID4VP Presentation Exchange Flow**
  - Verifier request parser (`src/services/openid4vp.ts`) supporting `openid4vp://` URIs and JSON payloads.
  - Dispatch presentation responses with simulated verifier callback.
- [x] **M4.2: Holder-Controlled Sharing (Per-Field Consent Screen)**
  - Interactive consent modal (`src/screens/SharingConsentModal.tsx`) identifying requesting Verifier and purpose.
  - Per-field toggle row (`src/components/ClaimToggleRow.tsx`) allowing selective disclosure.
  - SD-JWT disclosure assembler (`src/services/sdjwt.ts`) omitting withheld claims from presentation.
- [x] **M4.3: Local Shared-History Dashboard**
  - Local browser storage for presentation audit entries (`src/services/storage.ts`).
  - Dedicated "Sharing History" view (`src/screens/SharedHistoryScreen.tsx`) displaying disclosed vs. withheld attributes, verifier identity, timestamp, and outcome.
  - **Constraint verified:** History strictly stored on the client.

---

## Standalone Demo 2 Checklist (No custom portals needed)
*Stand-in for issuer/verifier: Inji demo presets / local mock services.*

- [x] 1. Web Wallet compiles and builds cleanly (`pnpm --dir wallet run build` -> 0 errors).
- [x] 2. Student claims Campus ID from demo issuer via OpenID4VCI (`handleIssueMock` / `QRScannerModal`).
- [x] 3. Stored credential renders as a formatted Campus ID card with validity badge.
- [x] 4. Verifier requests credential claims via OpenID4VP presets (Library gate / Exam admit).
- [x] 5. Student reviews consent screen and toggles OFF specific claims (e.g. hides roll number).
- [x] 6. Only chosen claims are presented in SD-JWT format and validated.
- [x] 7. Presentation event is logged in the local Sharing History screen.

