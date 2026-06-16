# Archive: Simple Frontend Kanban Board

## Metadata
- **Task ID**: TASK-005
- **Feature**: FEAT-004
- **Complexity**: Level 2 (user-capped; natural eval = Level 3)
- **Branch**: feature/FEAT-004-simple-frontend-kanban-board
- **Completed**: 2026-06-16
- **Phases**: 2

## Summary

Delivered the first frontend component of BanyanBoard — a minimal but fully functional React/TypeScript kanban board. The implementation covered two clean phases: Phase 1 scaffolded Vite + React + TypeScript with a static 3-column board and backend API integration; Phase 2 wired `@hello-pangea/dnd` for drag-and-drop card movement between columns. All 6 acceptance criteria were satisfied with 12/12 tests passing and a clean tsc + vite build.

## Solution

**Phase 1 — Frontend Scaffold + Static Board Layout**
- Scaffolded `frontend/` with Vite + React + TypeScript (`npm create vite@latest`)
- `types.ts`: `CardData`, `ColumnData`, `ColumnId` union type, `SEED_CARDS`, `COLUMNS` constants
- `api.ts`: `fetchBoards()` with `VITE_API_BASE` env var (12-Factor), graceful error fallback
- `Board.tsx`: 3-column layout, `useState` for card state, `useEffect` for API fetch, `apiError` indicator
- `Column.tsx`: accessible `role="region"` with label, droppable area
- `Card.tsx`: focusable `article` with title display
- 8 tests (Board.test.tsx + Column.test.tsx) — all passing

**Phase 2 — Drag-and-Drop Card Movement**
- Wrapped `Board` with `DragDropContext`; `onDragEnd` immutably maps card to new `ColumnId`
- `Column` uses `Droppable` render prop; `Card` uses `Draggable` render prop
- `card--dragging` CSS class applied during drag for visual feedback
- `DnD.test.tsx`: 4 tests — move card between columns, retain title, no-op on null destination, empty drop area
- Updated Board/Column tests with `@hello-pangea/dnd` module mock
- 12/12 tests passing; tsc + vite build + eslint all green

## Files Changed

| File | Change |
|------|--------|
| `frontend/` | New directory — entire Vite + React + TypeScript project |
| `frontend/src/types.ts` | New — `CardData`, `ColumnData`, `ColumnId`, `SEED_CARDS`, `COLUMNS` |
| `frontend/src/api.ts` | New — `fetchBoards()` with VITE_API_BASE and graceful error |
| `frontend/src/components/Board.tsx` | New — stateful board with DragDropContext and onDragEnd |
| `frontend/src/components/Column.tsx` | New — Droppable region with accessible label |
| `frontend/src/components/Card.tsx` | New — Draggable article with title |
| `frontend/src/__tests__/Board.test.tsx` | New — 5 tests; updated for dnd mock in Phase 2 |
| `frontend/src/__tests__/Column.test.tsx` | New — 3 tests; updated for dnd mock in Phase 2 |
| `frontend/src/__tests__/DnD.test.tsx` | New — 4 DnD integration tests |
| `frontend/package.json` | New — React + Vite + Vitest + @hello-pangea/dnd + @testing-library/react |

## Key Technical Decisions

1. **@hello-pangea/dnd** — Actively maintained fork of `react-beautiful-dnd`; identical API, no migration risk
2. **ColumnId as string union** — `'todo' | 'in-progress' | 'done'` enables clean cast from DnD `droppableId` without import overhead
3. **VITE_API_BASE env var** — 12-Factor compliant; defaults to `http://localhost:3001`, overridable per environment
4. **Vitest over Jest** — Shares Vite transform pipeline; avoids JSX/module-alias config friction

## Test Results

- Phase 1: 8/8 PASS
- Phase 2: 12/12 PASS (total)
- tsc --noEmit: CLEAN
- vite build: CLEAN
- eslint: CLEAN

## Known Technical Debt

- **Card drop ordering**: `destination.index` not respected in `onDragEnd`; cards land at array order not drop position
- **No CSS polish**: Columns not visually distinguished; no card elevation or design tokens applied
- **No loading state**: API fetch has no spinner; board title flashes from default "BanyanBoard" to API name
- **api.ts response cast**: `as { id: string; title: string }[]` trusts API shape without runtime validation

## Learned Rules Extracted

- **testing-patterns.md** (amended): Mock @hello-pangea/dnd via captured `onDragEnd` closure + `act()` — do not simulate mouse events
- **frontend-architecture.md** (created): Declare column identifiers as string union type for clean DnD cast without import

## Reflection

Full reflection: `memory-bank/reflection/reflection-TASK-005.md`

- **Task Quality**: Good — all ACs met, type-safe, 12-Factor compliant, zero rework between phases
- **Ecosystem Effectiveness**: Moderately Effective — Level 2 workflow correctly sized; UAT not run (recommended for UI tasks)
