# AI Control Center (`.ai/`)

Welcome to the AI Control directory. This directory serves as the persistent brain, instruction registry, and audit log for all AI agent operations across this project. It tracks AI activity, decisions, and instructions—independently of git code commits.

---

## Directory Structure

```text
.ai/
├── README.md                   # This guide and index
├── instructions/               # Instructions and constraints for AI agents
│   ├── system-rules.md         # Operational guidelines, guardrails, and role definitions
│   ├── architecture.md         # Architectural invariants & technical constraints
│   └── coding-standards.md     # Conventions for TypeScript, Python, React Native, Docker
├── records/                    # The AI "Git History" — log of interventions & decisions
│   ├── history.log.md          # Chronological ledger of all AI tasks, sessions, and outcomes
│   └── decisions.md            # Architecture & design decisions (ADRs) taken by/with AI
└── state/                      # Live operational state
    ├── current-task.md         # What the AI is currently executing, active goals, and blockers
    └── backlog.md              # Prioritized queue of planned AI actions
```

---

## Operating Protocol for AI Agents

Every AI agent working on this project must follow this protocol:

1. **Before Starting Any Task:**
   - Read `.ai/instructions/system-rules.md` and `.ai/instructions/architecture.md`.
   - Check `.ai/state/current-task.md` to confirm the active objective.
   - Read the latest entry in `.ai/records/history.log.md` for context.

2. **During Task Execution:**
   - Log key technical decisions into `.ai/records/decisions.md`.
   - Keep code changes strictly aligned with the architectural specifications in `.context/`.

3. **After Completing Any Task:**
   - Append a new log entry to `.ai/records/history.log.md` detailing:
     - Timestamp & session ID
     - Prompt / objective received
     - Actions taken & files touched
     - Summary of outcome and next recommended step.
   - Update `.ai/state/current-task.md` with the new status.
