# Table of Contents: Project Work Streams & Progress

This directory tracks the active work, member assignments, and implementation progress across both teams, matching the specifications in [`.context/team-split.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.context/team-split.md) and [`.context/problem-statement.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.context/problem-statement.md).

---

## Master Table of Contents

### 1. [Team 1: Issuer and Verifier](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.work/team-1-issuer-verifier.md)
*Goal: A college can issue, verify, and revoke a campus ID without needing our custom wallet.*

- **Member 1 (Kislay):**
  - M1.1: Inji Certify Local Deployment (Docker Compose)
  - M1.2: Campus ID Credential Schema & SD-JWT Configuration
  - M1.3: Mock Student Authentication & Issuance Flow
  - M1.4: Revocation & Status List Publication
- **Member 2:**
  - M2.1: Inji Verify Local Deployment & Configuration
  - M2.2: FastAPI Backend & PostgreSQL Database (accounts, audit logs, revoked-ID list; NO credential content stored)
  - M2.3: Issuer Admin Web Portal (Next.js - issue & revoke)
  - M2.4: Verifier Web Portal (Next.js)
- **Standalone Demo 1:**
  - Admin issues Campus ID -> Stock Inji Wallet/test client receives -> Verifier validates -> Admin revokes -> Verifier shows Revoked.

---

### 2. [Team 2: Holder Web Wallet (React)](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.work/team-2-wallet.md)
*Goal: A student receives a campus ID in the web-based Digital Identity Wallet and chooses exactly which fields to share.*

- **Member 3:**
  - M3.1: React Web Wallet Project Scaffolding & Encrypted Vault
  - M3.2: OpenID4VCI Credential Ingestion & Storage
  - M3.3: Campus ID Card Visual Component (fields, status, validity display)
- **Member 4:**
  - M4.1: OpenID4VP Presentation Exchange Flow
  - M4.2: Holder-Controlled Sharing (per-field consent screen with toggles; SD-JWT selective disclosure)
  - M4.3: Local Shared-History Dashboard (stored locally in browser vault only)
- **Standalone Demo 2:**
  - Web Wallet receives credential from demo issuer -> shows Campus ID card -> verifier requests fields -> holder selects fields via consent screen -> only chosen fields shared to Inji Verify instance.


---

### 3. [Joint Integration Track](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.work/shared-integration.md)
*Goal: Convergence of both standalone deliverables into a unified end-to-end review demo.*

- 3.1 Contract & Schema Harmonization
- 3.2 Network Configuration & Port Mapping
- 3.3 End-to-End Workflow Verification (Issue -> Store -> Selective Share -> Verify -> Revoke -> Re-verify fails)
- 3.4 Tampering & Security Negative Tests

---

## Live Progress Overview

```text
Team 1: Issuer & Verifier (Members 1 & 2)  [█████████░░░░░░░░░░░]  ~45% (4/8 Tasks Completed)
Team 2: Web Holder Wallet (Members 3 & 4)  [█████████████████░░░]  85% (6/6 Core Tasks Built & Verified)
Joint Integration Live Demo                [░░░░░░░░░░░░░░░░░░░░]   0% (0/4 Milestones Completed)
```

---

## Operating Protocol for AI Agents
1. All task progress must be updated in these files upon completion.
2. Every action must be immediately logged in [`AI_TASK_LOG.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/AI_TASK_LOG.md).
