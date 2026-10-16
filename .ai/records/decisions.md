# Architecture Decision Records (ADRs)

Key architectural and technical decisions made by or in consultation with AI agents.

---

## ADR-001: Separation of AI Control (`.ai/`) from Project Context (`.context/`)
- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The project requires a clear distinction between domain specifications / project documentation (human-authored specs like team splits and schemas) and AI operational control (agent rules, instructions, task history, and decision ledgers).
- **Decision:**
  - `.context/` will store domain specifications, business rules, API schemas, and team agreements.
  - `.ai/` will store instructions for AI agents, persistent execution state, operational logs, and decision history.
- **Consequences:** Provides a clean separation of concerns. AI agents have a dedicated directory to track their own actions without polluting user project documentation or git commit history.

---

## ADR-002: SD-JWT for Selective Disclosure on Inji Stack
- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** Verifiers on campus may require proof of enrollment without needing to see sensitive student attributes (e.g., student name, roll number, or photograph).
- **Decision:** Use SD-JWT (IETF Selective Disclosure for JWTs) as the credential format, configured in Inji Certify and supported during Inji Wallet OpenID4VP presentation.
- **Consequences:** Satisfies privacy-by-design requirements and the shared team agreement defined in `.context/team-split.md`.

---

## ADR-003: React Web-Based Holder Wallet Implementation
- **Date:** 2026-10-16
- **Status:** Accepted
- **Context:** The user instructed to focus on a React web-based wallet for the initial deliverables, reducing setup friction with mobile toolchains (Android Studio / Gradle / Emulators) while preserving the identical functional roles (Member 3: card display, credential receipt/storage; Member 4: sharing flow, consent toggles, local history).
- **Decision:** Implement Team 2's Holder Wallet as a React / Next.js web application utilizing client-side encrypted IndexedDB/Web Crypto for key storage, with browser camera/QR scanning for OpenID4VCI and OpenID4VP.
- **Consequences:** Simplifies local execution and testing, fully complies with the formal problem statement (Section 2, 5, 10, 11), and allows immediate web-to-web testing with Team 1's portals.

