# Digital Identity Wallet: Team Split
**Campus ID credential on MOSIP's Inji stack | 15 October 2026**

## What We Are Building
A campus ID wallet built on MOSIP's Inji stack. The college issues a digitally signed campus ID, the student keeps it in Inji Wallet and chooses which fields to reveal, a verifier checks it, and the college can revoke it later. The target flow, set by the industry mentor, is **issue, store, share, verify and revoke**.

---

## How We Split the Work
Two teams of two. Each team owns a complete slice that can be demonstrated on its own at the review, so nobody has to say it only works once the other team finishes. The one thing both teams must agree on is the shared credential definition below.

---

## Shared Agreement (Both Teams)

| Item | Decision |
| :--- | :--- |
| **Credential** | Campus ID |
| **Fields** | Name, roll number, branch, enrollment status, valid-until date, photo (optional) |
| **Disclosure** | The holder chooses which fields to share. The credential needs a format that can hide fields (SD-JWT); confirm this in the Certify configuration. |
| **Standards** | Issued with OpenID4VCI and shared with OpenID4VP, both handled by the Inji components |
| **Revocation** | The issuer marks a credential revoked and publishes a status list; the verifier checks it |

---

## Team 1: Issuer and Verifier (Members 1 and 2)
**Goal:** A college can issue, verify and revoke a campus ID without needing our custom wallet.

### What We Build
- Run **Inji Certify** and **Inji Verify** locally with Docker Compose, using the setup in their repositories.
- Define the campus ID schema and issue credentials after a mock student login.
- **Revocation:** Mark a credential revoked, publish the status list, and show Revoked in the verifier.
- A small web portal (**Next.js**) for the issuer admin (issue, revoke) and for the verifier, with a simple API (**FastAPI**) and **PostgreSQL** for accounts, audit logs and the revoked-ID list. No credential content is stored.

### Member Split
- **Member 1 (Kislay):** Inji Certify, schema, issuing, revocation and status list.
- **Member 2:** Inji Verify, issuer and verifier portals, API and database.

### Standalone Demo
The admin issues a campus ID, the verifier checks it and shows it as valid, the admin revokes it, and the verifier shows it as revoked. The credential is received by the stock Inji Wallet (unmodified) or a test client, so Team 2 is not needed.

---

## Team 2: Wallet (Members 3 and 4)
**Goal:** A student receives a campus ID in Inji Wallet and chooses exactly which fields to share.

### What We Build
- Build and run **Inji Wallet** on Android. It is a React Native and TypeScript app, and Android Studio must be set up first.
- A campus ID card in the wallet that shows the fields, status and validity clearly.
- **Holder-controlled sharing:** When a verifier asks for fields, a consent screen with a toggle per field, and only the chosen fields are shared.
- A local shared-history screen: what was shared, with whom and when, stored on the phone only.

### Member Split
- **Member 3:** Build and run the wallet, receive and store the credential, campus ID card display.
- **Member 4:** Sharing flow, per-field consent screen, shared history.

### Standalone Demo
The wallet receives a credential from an Inji demo issuer (or Team 1's issuer once it is ready), shows it as a campus ID card, and on a verifier's request lets the holder pick fields and shares only those, checked by an Inji Verify instance. Team 1's portals are not needed.

---

## Staying Independent

| Team | Needs from the other team | Stand-in until it is ready |
| :--- | :--- | :--- |
| **Team 1** | A wallet to receive and present credentials | Stock Inji Wallet or a test client |
| **Team 2** | An issuer and a verifier | An Inji demo issuer, or Certify and Verify run locally from the Inji repositories |

*Which demo issuer and verifier Inji offers should be checked when work starts.*

---

## Joining the Two (After each demo works)
1. Point the wallet at Team 1's Certify issuer.
2. Issue a campus ID from the admin portal and receive it in the wallet.
3. Share selected fields to Team 1's verifier.
4. Revoke the credential and verify it again.

*If integration is not finished by the review, each team still shows its own demo.*

---

## Parked until the Review
- Multipaz and BLE/NFC offline sharing
- AI/ML services such as OCR
- The MOSIP identity layer (a mock student login is enough for now)
- Cloud deployment (run everything locally for now)
- Cloud backup of credentials
