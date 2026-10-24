# Coding Standards & Guidelines

Technical conventions for all AI-generated or modified code in this project.

---

## 1. Python / FastAPI

- **Style:** PEP 8, formatted with Black/Ruff. Type annotations required everywhere (`from typing import Optional, List`).
- **Validation:** Strict Pydantic v2 schemas for all request/response models.
- **Async First:** Async endpoints (`async def`) with non-blocking DB sessions.
- **Error Handling:** Use custom `HTTPException` with structured JSON detail payloads:
  ```json
  { "error": { "code": "STUDENT_NOT_FOUND", "message": "Roll number not found" } }
  ```

---

## 2. TypeScript / Next.js / React Native

- **Strict Typing:** No `any`. Use discriminated unions and strict interfaces.
- **Functional Components:** React Hooks only (`useState`, `useEffect`, `useCallback`). No class components.
- **Styling:**
  - Next.js: Tailwind CSS utility classes.
  - React Native: `StyleSheet.create` or Tailwind/NativeWind if configured in the Inji Wallet repo.
- **State Management:** Keep state as local as possible; use Redux/Zustand only where already integrated into the Inji Wallet codebase.

---

## 3. Docker & Infrastructure

- **Multi-stage Builds:** Minimal final images (alpine or distroless where applicable).
- **Explicit Version Tags:** Never use `:latest` in production configs. Use specific version tags (e.g., `postgres:15-alpine`).
- **Health Checks:** Include health checks in `docker-compose.yml` for services that depend on database readiness.
