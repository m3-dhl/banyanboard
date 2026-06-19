# Progress

## History

---

## Task Archive: TASK-017

**Task**: Card Detail View
**Status**: ✅ ARCHIVED
**Date**: 2026-06-19
**Archive**: `memory-bank/archive/archive-TASK-017.md`

---

## TASK-017 Reflection (REFLECTION_COMPLETE)

**Date**: 2026-06-19

#### Reflection (Step 3)
- Completed: 2026-06-19
- Document: memory-bank/reflection/reflection-TASK-017.md
- Task Quality: Excellent — all 15 ACs met, 292 tests (112 backend + 180 frontend), all creative decisions stable across 3 phases, zero MUST-blocking rework
- Ecosystem Effectiveness: Highly Effective — creative phase resolved click-vs-drag, library selection, and state ownership before coding began; no course corrections needed

---

## TASK-017 Phase 3 — Integration + Polish + E2E Tests

**Date**: 2026-06-19
**Status**: BUILD_COMPLETE (all 3 phases done)

### Tests Added (Phase 3)
- `frontend/src/__tests__/DescriptionSection.xss.test.tsx` — 3 tests; real react-markdown XSS safety (no mock): script tag, onerror attr, normal Markdown rendering
- `frontend/src/__tests__/Board.detail.test.tsx` — 3 tests added: title change reflects on board card, column change reflects in board state, closing modal returns focus to originating card (vi.useFakeTimers)

### Verification
- Frontend: 180/180 tests pass (18 test files)
- Backend: 112/112 tests pass
- TSC: clean
- Lint: clean

### Key Observations
- react-markdown is XSS-safe by construction (no innerHTML, no dangerouslySetInnerHTML) — confirmed by jsdom assertion
- Focus-return via setTimeout(0) + vi.runAllTimersAsync() pattern works correctly
- Board state propagation (title, column changes) verified end-to-end through Board → CardDetailModal → handlers

---

## Task Archive: TASK-014

**Task**: Multi-label filter selection (+ TASK-015 picker auto-close, TASK-016 viewport overflow)
**Status**: ✅ ARCHIVED
**Date**: 2026-06-19
**Archive**: `memory-bank/archive/archive-TASK-014.md`

---

## Task Archive: TASK-013

**Task**: Failed to create label — please try again (label creation 404 bug fix)
**Status**: ARCHIVED
**Date**: 2026-06-19
**Archive**: `memory-bank/archive/archive-TASK-013.md`

---

## Task Archive: TASK-012

**Task**: Card Deletion
**Status**: ✅ ARCHIVED
**Date**: 2026-06-17
**Archive**: `memory-bank/archive/archive-TASK-012.md`

---

### 2026-06-17 — TASK-012 Reflection (REFLECTION_COMPLETE)

#### Reflection (Step 3)
- Completed: 2026-06-17
- Document: memory-bank/reflection/reflection-TASK-012.md
- Task Quality: Excellent — all 5 ACs met, 13 tests (7 backend + 6 frontend), zero rework, clean typecheck and lint, portal + rollback + container-Escape patterns applied correctly
- Ecosystem Effectiveness: Highly Effective — Level 2 two-phase split natural (backend endpoint first, then frontend), 6 learned rules applied correctly, spec quality enabled pattern-assembly coding with zero discovery overhead

---

## Task Archive: TASK-009

**Task**: Card Reordering
**Status**: ✅ ARCHIVED
**Date**: 2026-06-17
**Archive**: `memory-bank/archive/archive-TASK-009.md`

---

### 2026-06-17 — TASK-009 Reflection (REFLECTION_COMPLETE)

#### Reflection (Step 3)
- Completed: 2026-06-17
- Document: memory-bank/reflection/reflection-TASK-009.md
- Task Quality: Excellent — all 7 ACs met, 65 backend + 81 frontend tests (16 net new), clean atomic transaction, optimistic revert, visibleIdSet filter-mapping
- Ecosystem Effectiveness: Highly Effective — 2-phase decomp matched natural stack boundary; Spec Writer pre-identified filter×reorder edge case (AC-ENTRY-2); 5 learned rules applied from prior tasks

---

## Task Archive: TASK-008

**Task**: Card Labels
**Status**: ✅ ARCHIVED
**Date**: 2026-06-16
**Archive**: `memory-bank/archive/archive-TASK-008.md`

---

### 2026-06-16 — TASK-008 Reflection (REFLECTION_COMPLETE)

#### Reflection (Step 3)
- Completed: 2026-06-16
- Document: memory-bank/reflection/reflection-TASK-008.md
- Task Quality: Good — all 13 ACs met, 74 tests, WCAG AA verified, full keyboard nav, dnd-safe portal popover
- Ecosystem Effectiveness: Highly Effective — 3-phase decomp matched natural dep order; creative phase resolved 3 design questions before build; code reviewer caught 4 blocking issues

---

### 2026-06-16 — TASK-008 Phase 2: Frontend label badges + picker (PHASE_COMPLETE)

**Branch**: feature/FEAT-007-card-labels

**Delivered**:
- `frontend/src/hooks/useFocusTrap.ts` — minimal focus trap hook for accessible dialogs; dep array intentionally omits `containerRef` (ref objects are stable)
- `frontend/src/components/LabelBadge.tsx` — colored pill badge rendering label name + WCAG-AA hex color as background
- `frontend/src/components/LabelPickerPopover.tsx` — popover portal-rendered into `document.body` (avoids CSS transform stacking context issues with `@hello-pangea/dnd` during drag); Escape listener scoped to container element (not document) to avoid interference with dnd keyboard handlers
- `frontend/src/components/LabelManagementPanel.tsx` — dialog with create form (radio color swatches from `LABEL_COLORS`) and per-label delete
- `frontend/src/components/FilterBar.tsx` — horizontal chip filter strip; conditionally rendered when labels exist on the board
- `frontend/src/types.ts` (modified) — added `Label` interface, `LABEL_COLORS` constant (10 WCAG-AA colors), updated `CardData.labels?: Label[]`
- `frontend/src/api.ts` (modified) — added `fetchCards`, `fetchLabels`, `createLabel`, `deleteLabel`, `attachLabel`, `detachLabel`
- `frontend/src/components/Card.tsx` (modified) — renders `LabelBadge` list, `[+ Label]` button with `aria-label`, `LabelPickerPopover` via ReactDOM portal
- `frontend/src/components/Column.tsx` (modified) — passes `labels` and `onLabelToggle` through to Card
- `frontend/src/components/Board.tsx` (modified) — owns label/filter state, optimistic label attach/detach, `fetchLabels` on mount, `FilterBar` + `LabelManagementPanel` rendering; `labelAssignError` cleared at start of each mutation handler (matching `cardCreateError` pattern)
- `frontend/src/App.css` (modified) — CSS for all new label components
- `frontend/src/__tests__/ActivityFeed.test.tsx` (fix) — fixed pre-existing test failure: `formatTime` renders "just now", check `datetime` attribute instead of text content

**Test results**: 71/71 PASS (26 new + 45 existing)
**Build**: PASS (vite)
**Lint**: PASS (eslint)

**Key implementation notes**:
- `LabelPickerPopover` uses `ReactDOM.createPortal` into `document.body` to avoid CSS transform stacking context issues that arise inside `@hello-pangea/dnd` draggable containers
- Escape key listener attached to the popover container element (not `document`) so it does not fire when dnd is handling keyboard drag events
- `useFocusTrap` dep array omits `containerRef` intentionally (ref objects are stable across renders; eslint-disable comment documents the reason)
- `labelAssignError` cleared at start of each mutation handler, matching the existing `cardCreateError` pattern for `onAddCard`

---

### 2026-06-16 — TASK-008 Phase 1: Data model + backend endpoints (PHASE_COMPLETE)

**Branch**: feature/FEAT-007-card-labels

**Delivered**:
- `backend/src/db/migrations/003_create_labels.sql` — DDL for `labels` and `card_labels` tables (UUID PK, board_id FK with cascade, UNIQUE(name, board_id), indexes)
- `backend/src/types/label.types.ts` — `Label`, `LabelSummary`, `CreateLabelDto` interfaces
- `backend/src/errors/index.ts` — Shared `ValidationError`, `NotFoundError`, `ConflictError` classes
- `backend/src/repositories/label.repository.ts` — `createLabel`, `getLabelsByBoard`, `getLabelById`, `deleteLabel`, `attachLabelToCard`, `detachLabelFromCard` (pg error code handling for FK/PK violations)
- `backend/src/services/label.service.ts` — validation (hex color regex, name length, boardId presence, duplicate check), delegates to repository
- `backend/src/controllers/label.controller.ts` — HTTP handlers with dual instanceof/name error guards
- `backend/src/routes/label.routes.ts` — `POST /labels`, `GET /labels`, `DELETE /labels/:id`
- `backend/src/types/card.types.ts` (modified) — added `labels?: LabelSummary[]` to `Card`
- `backend/src/repositories/card.repository.ts` (modified) — added `getCards()` with LEFT JOIN + `json_agg`
- `backend/src/services/card.service.ts` (modified) — added `getCards()`, replaced local `ValidationError` with shared class from `errors/index.ts`
- `backend/src/controllers/card.controller.ts` (modified) — added `getCards` handler
- `backend/src/routes/card.routes.ts` (modified) — added `GET /cards`, `POST /cards/:id/labels`, `DELETE /cards/:id/labels/:labelId`
- `backend/src/app.ts` (modified) — mounted `labelRouter` at `/labels`
- `backend/src/__tests__/label.test.ts` — 21 tests (label CRUD + card-label endpoints + GET /cards label integration)

**Test results**: 58/58 PASS (21 new + 37 existing)
**Build**: PASS (tsc)
**Typecheck**: CLEAN

---

---

## Task Archive: TASK-007

**Task**: Task Creation System
**Status**: ✅ ARCHIVED
**Date**: 2026-06-16
**Archive**: `memory-bank/archive/archive-TASK-007.md`

---

### 2026-06-16 — TASK-007 Reflection (REFLECTION_COMPLETE)

#### Reflection (Step 3)
- Completed: 2026-06-16
- Document: memory-bank/reflection/reflection-TASK-007.md
- Task Quality: Good — all 5 ACs met, 80 tests (43 frontend + 37 backend), clean full-stack implementation with optimistic rollback
- Ecosystem Effectiveness: Highly Effective — 2-phase decomp validated, 3 learned rules directly applied, Level 2 cap worked but natural Level 3 complexity exposed in Phase 2

---

---

## Task Archive: TASK-006

**Task**: Realtime Activity Feed
**Status**: ✅ ARCHIVED
**Date**: 2026-06-16
**Archive**: `memory-bank/archive/archive-TASK-006.md`

---

### 2026-06-16 — TASK-006 Reflection (REFLECTION_COMPLETE)

#### Reflection (Step 3)
- Completed: 2026-06-16
- Document: memory-bank/reflection/reflection-TASK-006.md
- Task Quality: Good — all 9 ACs met, 24/24 tests, clean TypeScript, accessible ARIA
- Ecosystem Effectiveness: Highly Effective — 2-phase decomp clean, Spec Writer pre-resolved layout ambiguity, Code Reviewer caught ARIA error before integration

---

### 2026-06-16 — TASK-006 Phase 2: Wire feed into Board.tsx onDragEnd (BUILD_COMPLETE)

**Branch**: feature/FEAT-005-realtime-activity-feed

**Delivered**:
- `frontend/src/components/Board.tsx` (modified) — `feedEntries` useState, `onDragEnd` extended to create `ActivityFeedEntry` on cross-column drop, capped at 20, `<ActivityFeed>` rendered below board columns
- `frontend/src/__tests__/Board.feed.test.tsx` — 6 new tests (empty state, cross-column entry, same-column no-entry, reverse-chronological order, 20-entry cap, re-render survival)
- `frontend/src/__tests__/Board.test.tsx` (fix) — column region query narrowed to exclude ActivityFeed section
- `frontend/src/__tests__/DnD.test.tsx` (fix) — card title assertion scoped to column region

**Test results**: 24/24 PASS
**Build**: PASS (vite)
**Lint**: PASS (eslint)

**AC Coverage (Phase 2)**:
- AC-HAPPY-1: feed entry on cross-column drag ✓
- AC-HAPPY-2: reverse-chronological accumulation ✓
- AC-HAPPY-3: 20-entry cap + oldest dropped ✓
- AC-HAPPY-4: same-column drop = no entry ✓
- AC-ERROR-1: feed works in offline/API-error state ✓ (no API dependency)
- AC-ASYNC-1: feed survives unrelated re-renders ✓
- AC-INTEGRATION-1: entries derived from real onDragEnd DropResult ✓

---

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
