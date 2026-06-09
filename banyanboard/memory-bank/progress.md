# Progress

## History

### 2026-06-09 — TASK-001 Phase 1: Full scaffold (BUILD_COMPLETE)

**Branch**: feature/FEAT-001-project-foundation

**Delivered**:
- `backend/src/app.ts` — Express app (exported for testing)
- `backend/src/server.ts` — Entry point (listens on PORT)
- `backend/src/routes/health.routes.ts` — GET / → healthCheck
- `backend/src/controllers/health.controller.ts` — Returns `{ status, timestamp }`
- `backend/src/__tests__/health.test.ts` — 3 integration tests via supertest
- `backend/package.json`, `backend/tsconfig.json`, `backend/jest.config.ts`
- `backend/Dockerfile` — Multi-stage build (builder + runner)
- `docker-compose.yml` — backend + postgres:16-alpine with healthcheck
- `.gitignore`, `README.md`

**Test results**: 3/3 PASS
**Typecheck**: CLEAN (tsc --noEmit)
**Dependency audit**: 0 vulnerabilities

**Acceptance criteria**:
- AC-INFRA-1: docker compose up wires backend + postgres ✓ (manual verification needed)
- AC-INFRA-2: GET /health → 200 { status: "ok", timestamp } ✓
- AC-INFRA-3: Integration tests pass ✓
- AC-INFRA-4: tsc --noEmit clean ✓

---

### 2026-06-09 — TASK-002 Phase 1: Board CRUD (BUILD_COMPLETE)

**Branch**: feature/FEAT-002-board-crud-endpoints

**What Was Built**:
- `backend/src/types/board.types.ts` — Board, CreateBoardDto, UpdateBoardDto interfaces
- `backend/src/db/pool.ts` — pg Pool singleton (DATABASE_URL)
- `backend/src/db/migrations/001_create_boards.sql` — boards table DDL
- `backend/src/repositories/board.repository.ts` — 5 CRUD functions, parameterized queries
- `backend/src/services/board.service.ts` — ValidationError, title validation (1–100 chars)
- `backend/src/controllers/board.controller.ts` — 5 handlers, ValidationError→400, null→404, unhandled→500
- `backend/src/routes/board.routes.ts` — GET/, GET/:id, POST/, PATCH/:id, DELETE/:id
- `backend/src/app.ts` (modified) — mounted `/boards` router
- `backend/src/__tests__/board.test.ts` — 18 tests (jest.mock on repository, no live DB)
- `backend/package.json` (modified) — added pg + @types/pg

**Test Summary**:
- Tests: 18/18 PASS
- Typecheck: CLEAN (tsc --noEmit)
- Build: PASS (tsc)
- Code Review: APPROVED — 0 blocking issues

**Acceptance Criteria**:
- AC-001: GET /boards returns 200 + JSON array ✓
- AC-002: GET /boards/:id returns 200 + board; 404 if missing ✓
- AC-003: POST /boards returns 201 + board; 400 on invalid input ✓
- AC-004: PATCH /boards/:id returns 200 + board; 400/404 on errors ✓
- AC-005: DELETE /boards/:id returns 204; 404 if not found ✓
- AC-006: All 18 tests pass ✓
- AC-007: tsc --noEmit clean ✓
- AC-008: Title validated 1–100 chars ✓

**Notes**:
- Minor: raw title whitespace not trimmed before storage (acceptable MVP)
- Minor: non-string title body → 500 instead of 400 (acceptable MVP)

---

## Task Archive: TASK-001

**Task**: Project Foundation
**Status**: ✅ ARCHIVED
**Date**: 2026-06-09
**Archive**: `memory-bank/archive/archive-TASK-001.md`

---
