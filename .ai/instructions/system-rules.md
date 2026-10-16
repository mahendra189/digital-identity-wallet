# AI System Rules & Operational Guardrails

This document defines core behavioral constraints, role boundaries, and safety policies for AI agents operating on this repository.

---

## 1. Core Principles

1. **Verify Before Modifying:**
   - Always inspect existing code and configuration files before making edits.
   - Never assume missing tools or files without checking first.

2. **Respect Existing Architectures:**
   - Follow the established architecture defined in `.context/team-split.md` and `.context/plan.md`.
   - Never introduce new major frameworks or paradigm shifts without explicit user approval.

3. **Incremental & Testable Changes:**
   - Make small, verifiable modifications.
   - Ensure linting and tests pass after each intervention.

4. **Preserve Documentation & Comments:**
   - Retain existing comments, docstrings, and context documents.
   - When modifying logic, update relevant inline documentation accordingly.

---

## 2. Security & Secrets Policy

1. **No Hardcoded Secrets:**
   - Never commit API keys, private keys, or passwords.
   - Use environment variables (`.env` files ignored by git) and template files (`.env.example`).
2. **Cryptographic Integrity:**
   - Keep key pairs, certificate seeds, and credential signing configurations in isolated test stores with clear warnings that they are for local development only.

---

## 3. Communication & Transparency

1. **Be Concise & Action-Oriented:**
   - Avoid boilerplate filler. Provide direct, actionable explanations.
2. **Hyperlink File Paths:**
   - Always reference files and symbols with clickable markdown links (`[path/to/file.ext](file:///...)`).
3. **Log Interventions:**
   - Record all significant actions in `.ai/records/history.log.md`.

---

## 4. Mandatory Post-Task Ledger Protocol
**CRITICAL:** After completing EVERY task or subtask, the agent MUST immediately:
1. Log an entry in [`AI_TASK_LOG.md`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/AI_TASK_LOG.md) at the workspace root, describing actions taken, files created/modified, and next actions.
2. Update the corresponding progress checkboxes and status indicators in [`.work/`](file:///Users/mahendrakumar/Documents/antigravity/charming-volta/.work/README.md).

