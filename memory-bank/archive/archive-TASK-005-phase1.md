# Archive: TASK-005 Phase 1 — Frontend Scaffold + Static Board Layout

**Task**: TASK-005 — Simple Frontend Kanban Board
**Phase**: Phase 1 of 2
**Complexity**: Level 2
**Branch**: feature/FEAT-004-simple-frontend-kanban-board
**Archived**: 2026-06-16
**Status**: PHASE_COMPLETE (Phase 2 pending)

---

## Phase Goal

Scaffold the `frontend/` directory with Vite + React + TypeScript and deliver a static, accessible kanban board with 3 fixed columns, in-memory seed cards, and a GET /boards API call with graceful error fallback.

---

## What Was Built

### New Files

| File | Purpose |
|------|---------|
| `frontend/` | Vite + React + TypeScript project scaffolded via `npm create vite@latest` |
| `frontend/src/types.ts` | `CardData`, `ColumnData`, `ColumnId`, `COLUMNS`, `SEED_CARDS` |
| `frontend/src/api.ts` | `fetchBoards()` — GET /boards, throws on non-ok; env-var `VITE_API_BASE` |
| `frontend/src/components/Board.tsx` | 3-column board, `useState` for cards, API fetch on mount, error state |
| `frontend/src/components/Column.tsx` | `<section role="region">`, accessible label, cards list, `data-testid="drop-area"` |
| `frontend/src/components/Card.tsx` | `<div role="article">`, `tabIndex={0}`, displays title |
| `frontend/src/App.css` | Board/column/card layout styles, WCAG 2.1 AA focus ring |
| `frontend/src/__tests__/Board.test.tsx` | 5 tests — layout, seed cards, API happy/error/unreachable |
| `frontend/src/__tests__/Column.test.tsx` | 3 tests — label, card list, empty state + drop area |
| `frontend/src/test-setup.ts` | `@testing-library/jest-dom` import |

### Modified Files

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Replaced Vite scaffold boilerplate → renders `<Board />` |
| `frontend/vite.config.ts` | Added Vitest config (jsdom, globals, setupFiles); imports from `vitest/config` |
| `frontend/package.json` | Added `test`/`test:watch` scripts; dev deps: vitest, @testing-library/* |
| `frontend/tsconfig.app.json` | Added `vitest/globals` type; excluded `src/__tests__` from prod tsc |

---

## Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| `Board.test.tsx` | 5 | PASS |
| `Column.test.tsx` | 3 | PASS |
| **Total** | **8** | **8/8 PASS** |

---

## Build + Quality

| Check | Result |
|-------|--------|
| `tsc -b` | CLEAN |
| `vite build` | PASS (192KB bundle) |
| Vitest | 8/8 PASS |

---

## Acceptance Criteria Coverage (Phase 1 scope)

| AC | Status | Notes |
|----|--------|-------|
| AC-ENTRY-1: 3 columns render on load | ✅ | Verified by test + build |
| AC-HAPPY-1: Seed cards in correct columns | ✅ | 3 seed cards across 3 columns |
| AC-HAPPY-3: GET /boards fetched on mount | ✅ | Graceful fallback if unreachable |
| AC-ERROR-1: Empty column renders with drop area | ✅ | `data-testid="drop-area"` always present |
| AC-ERROR-2: Board renders when backend unreachable | ✅ | `role="status"` indicator shown |
| AC-HAPPY-2: Drag-and-drop | ⏳ | Phase 2 |

---

## Known Issues / Code Review Findings

1. `Board.tsx:17` — `_setCards` is declared but unused in Phase 1. **Must be wired to DnD `onDragEnd` in Phase 2**, otherwise card drops will not update state.
2. `Board.test.tsx:47` — test asserts `queryByRole('alert')` is null after network error, but the error path renders `role="status"` not `role="alert"`. The assertion passes vacuously. **Should be corrected in Phase 2 test iteration.**

---

## Next

Run `/banyan-build TASK-005` to implement Phase 2: drag-and-drop with `@hello-pangea/dnd`.
