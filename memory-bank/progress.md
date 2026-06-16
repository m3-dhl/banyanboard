# Progress

## History

### 2026-06-16 — TASK-006 Phase 1: ActivityFeed component + types (BUILD Phase 1 COMPLETE)

**Branch**: feature/FEAT-005-realtime-activity-feed

**Delivered**:
- `frontend/src/types.ts` — Added `ActivityFeedEntry` interface (`id`, `cardTitle`, `fromColumn: ColumnId`, `toColumn: ColumnId`, `timestamp: Date`)
- `frontend/src/components/ActivityFeed.tsx` — Presentational component: heading, empty state, `<div role="log"><ul>` list, 20-entry cap, ColumnId→label resolution
- `frontend/src/__tests__/ActivityFeed.test.tsx` — 6 Vitest tests (empty state, heading, list rendering, entry content, 20-entry cap, ARIA role)

**Test results**: 18/18 PASS (all existing + 6 new)
**Build**: PASS (tsc + vite)
**Lint**: PASS (eslint)
**Code review**: APPROVED (2 recommended fixes applied — timestamp narrowed to `Date`, ARIA corrected to `div[role=log]` + `ul`)

**AC Coverage (Phase 1)**:
- AC-ENTRY-1: feed visible, heading present, empty state ✓
- AC-ERROR-2: graceful empty render ✓

---

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

### 2026-06-09 — TASK-002 Phase 1: Board CRUD (BUILD_COMPLETE)

**Branch**: feature/FEAT-002-board-crud-endpoints
**Commit**: 564c635

**Delivered**:
- `backend/src/types/board.types.ts` — Board, CreateBoardDto, UpdateBoardDto interfaces
- `backend/src/db/pool.ts` — pg Pool singleton reading DATABASE_URL
- `backend/src/db/migrations/001_create_boards.sql` — DDL for boards table
- `backend/src/repositories/board.repository.ts` — CRUD queries via pg
- `backend/src/services/board.service.ts` — Business logic + validation
- `backend/src/controllers/board.controller.ts` — Express request handlers
- `backend/src/routes/board.routes.ts` — Router wiring
- `backend/src/app.ts` — Mounted /boards router
- `backend/src/__tests__/board.test.ts` — 18 integration tests via supertest + jest.mock

**Test results**: 18/18 PASS (target was 15)
**Typecheck**: CLEAN (tsc --noEmit)
**Code Review**: APPROVED, 0 blocking issues, Security PASS

**Acceptance criteria**: All 8 ACs met ✓

#### Reflection (Step 3)
- Completed: 2026-06-09
- Document: memory-bank/reflection/reflection-TASK-002.md
- Task Quality: Excellent — all ACs met, 18/18 tests, clean architecture
- Ecosystem Effectiveness: Highly Effective — TDD-first pipeline produced zero-rework build

---

### 2026-06-09 — TASK-003 Phase 1: CORS Middleware (BUILD_COMPLETE)

**Branch**: task/003-add-cors-configuration

**Delivered**:
- `backend/src/config/cors.ts` — `buildCorsOptions()` pure function, env-var driven
- `backend/src/app.ts` (modified) — CORS mounted as first middleware
- `backend/src/__tests__/cors.test.ts` — 4 integration tests (simple + preflight)
- `backend/package.json` (modified) — added `cors@^2.8.6` + `@types/cors`

**Test results**: 22/22 PASS (18 existing + 4 new)
**Typecheck**: CLEAN
**Code Review**: APPROVED, 0 blocking issues, Security PASS

#### Reflection (Step 3)
- Completed: 2026-06-09
- Document: memory-bank/reflection/reflection-TASK-003.md
- Task Quality: Excellent — all requirements met, 22/22 tests, zero rework
- Ecosystem Effectiveness: Highly Effective — Level 1 workflow correctly scoped, testing-patterns learned rule directly reused

---

### 2026-06-16 — TASK-004 Phase 1: JSON Error Handler Middleware (BUILD_COMPLETE)

**Branch**: task/004-add-input-validation-middleware

**Delivered**:
- `backend/src/middleware/json-error.ts` — `jsonErrorHandler` ErrorRequestHandler; catches SyntaxError from express.json(), returns `{ error: string }` 400
- `backend/src/app.ts` (modified) — jsonErrorHandler mounted after express.json(), before routes
- `backend/src/__tests__/validation.test.ts` — 7 tests covering malformed JSON (2), valid pass-through (2), existing domain validation (3)

**Test results**: 29/29 PASS (7 new + 22 existing)
**Typecheck**: CLEAN (tsc --noEmit)
**Code Review**: APPROVED, 0 blocking issues, Security PASS

---

## Task Archive: TASK-002

**Task**: Board model + full CRUD endpoints + tests
**Status**: ✅ ARCHIVED
**Date**: 2026-06-09
**Archive**: `memory-bank/archive/archive-TASK-002.md`

---

## Task Archive: TASK-003

**Task**: Add CORS configuration (allowed origins, methods, headers)
**Status**: ✅ ARCHIVED
**Date**: 2026-06-09
**Archive**: `memory-bank/archive/archive-TASK-003.md`

---

## Task Archive: TASK-005

**Task**: Simple Frontend Kanban Board
**Status**: ✅ ARCHIVED
**Date**: 2026-06-16
**Archive**: `memory-bank/archive/archive-TASK-005.md`

---

### 2026-06-16 — TASK-005 Phase 1: Frontend Scaffold + Static Board Layout (PHASE_COMPLETE)

**Branch**: feature/FEAT-004-simple-frontend-kanban-board

**Delivered**:
- `frontend/` — Vite + React + TypeScript scaffold
- `frontend/src/types.ts` — CardData, ColumnData, SEED_CARDS
- `frontend/src/api.ts` — GET /boards with graceful error fallback
- `frontend/src/components/Board.tsx` — 3-column board, useState, API fetch
- `frontend/src/components/Column.tsx` — accessible region + drop area
- `frontend/src/components/Card.tsx` — focusable article with title
- `frontend/src/__tests__/Board.test.tsx` — 5 tests
- `frontend/src/__tests__/Column.test.tsx` — 3 tests

**Test results**: 8/8 PASS
**Build**: tsc + vite build CLEAN
**Phase Archive**: `memory-bank/archive/archive-TASK-005-phase1.md`

---

### 2026-06-16 — TASK-005 Phase 2: Drag-and-Drop Card Movement (PHASE_COMPLETE)

**Branch**: feature/FEAT-004-simple-frontend-kanban-board
**Commit**: 50c28b2

**Delivered**:
- `frontend/src/components/Board.tsx` (modified) — DragDropContext + onDragEnd handler
- `frontend/src/components/Column.tsx` (modified) — Droppable render prop
- `frontend/src/components/Card.tsx` (modified) — Draggable render prop + card--dragging CSS class
- `frontend/src/__tests__/DnD.test.tsx` — 4 DnD-specific tests
- `frontend/src/__tests__/Board.test.tsx` (modified) — updated with dnd mock
- `frontend/src/__tests__/Column.test.tsx` (modified) — updated with dnd mock

**Test results**: 12/12 PASS
**Build**: tsc + vite build + eslint CLEAN

#### Reflection (Step 3)
- Completed: 2026-06-16
- Document: memory-bank/reflection/reflection-TASK-005.md
- Task Quality: Good — all 6 ACs met, 12/12 tests, clean TypeScript, 12-factor compliant
- Ecosystem Effectiveness: Moderately Effective — Level 2 workflow correctly sized; UAT not run

---

## Task Archive: TASK-004

**Task**: Add input validation middleware (required fields + malformed JSON)
**Status**: ✅ ARCHIVED
**Date**: 2026-06-16
**Archive**: `memory-bank/archive/archive-TASK-004.md`

---
