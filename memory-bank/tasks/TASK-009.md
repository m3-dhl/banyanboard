# TASK-009: Card Reordering

**Complexity**: Level 2
**Status**: PLAN_COMPLETE
**Roadmap**: FEAT-008
**Branch**: feature/FEAT-008-card-reordering
**Worktree**: N/A

## Task Description

Enable users to reorder cards within the same column via drag-and-drop. Currently `onDragEnd` in `Board.tsx` (line 55) exits early when `destination.droppableId === source.droppableId && destination.index === source.index` but does **not** handle the case where source and destination are in the same column at different indices — those drops simply update `columnId` without reordering (the array position is unchanged). The feature requires:

- A `position` field on the `cards` table (DB migration `004_add_card_position.sql`)
- Backend: a dedicated `PATCH /cards/:id/position` endpoint that accepts `{ position: number }` and reorders the affected cards in the DB atomically
- Frontend: handle same-column drag-and-drop in `onDragEnd`, optimistically reorder the local `cards` array, call the new API, and revert on failure

---

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Dev Team Member / Team Lead (both personas need to organize cards within a column — e.g., re-prioritize the "Todo" column by dragging the most urgent card to the top)
**Creative Exploration Needed**: No — interaction model is fully constrained by the existing `@hello-pangea/dnd` setup; no new UI surfaces required

### Invocation Method

| Field | Value | Confidence |
|-------|-------|-----------|
| Location | Board view — any column (Todo / In Progress / Done) | HIGH |
| Element | Existing `@hello-pangea/dnd` drag handle on every card (`Draggable` in `frontend/src/components/Column.tsx`) | HIGH |
| Visibility | Always visible — all cards are draggable regardless of filter state | HIGH |
| User flow | App loads → board visible → user grabs card within same column → drops at new index → card snaps to new position | HIGH |
| Filter interaction | When `activeFilter` is active, `filteredCards` is rendered; reorder must operate on the **full** `cards` array (not the filtered slice) to avoid corrupting positions of hidden cards | HIGH — this is a non-trivial edge case, see AC-ENTRY-2 |

### Success Criteria

- **User sees**: Card snaps to new position within the column immediately (optimistic update) — no page reload needed
- **User can verify at**: Board view — column shows updated card order; after page refresh, order is preserved (sourced from DB `position` column)
- **Data persisted**: `cards` table — `position` INTEGER column updated for the dragged card; sibling cards in the same column shifted accordingly
- **Observable within**: Immediate (optimistic UI) + async backend confirmation; no visible spinner required

### Acceptance Criteria

**AC-ENTRY-1**: A user can initiate a drag on any card within a column and drop it at a different index in the same column without the card jumping back.

**AC-ENTRY-2**: When a label filter is active (`activeFilter !== null`), reordering a visible card updates positions in the full (unfiltered) `cards` array. Hidden cards (filtered out) must not lose their relative ordering.

**AC-HAPPY-1**: After a same-column drop, the card appears at the correct new position in the column immediately (optimistic update). The UI does not flicker.

**AC-HAPPY-2**: After a page refresh, cards appear in the order last set by the user. The backend `GET /cards` query orders by `position ASC` per column (replacing the current `ORDER BY created_at DESC`).

**AC-HAPPY-3**: Cross-column drag-and-drop continues to work unchanged. The `onDragEnd` column-move branch (`destination.droppableId !== source.droppableId`) must not be modified in a way that breaks existing behavior.

**AC-ERROR-1**: If the `PATCH /cards/:id/position` call fails (network error or 5xx), the optimistic reorder is reverted — cards return to their pre-drag order. No crash, no blank screen.

**AC-ERROR-2**: Concurrent reorders by multiple users do not corrupt data. The backend reorder is atomic: a single DB transaction reassigns `position` values for all affected cards in the column.

**AC-VERIFY-1**: Backend `GET /cards` returns cards ordered by `position ASC, created_at ASC` (position primary, creation time as stable tiebreaker for cards seeded before the migration).

### Scope Boundaries

**In scope:**
- `position` INTEGER column on `cards` table — migration `004_add_card_position.sql`
- `PATCH /cards/:id/position` endpoint with atomic repositioning logic
- `onDragEnd` same-column branch in `Board.tsx` — optimistic array reorder + API call + revert
- Updated `GET /cards` query ordering (repository change in `card.repository.ts`)
- `reorderCard` function added to `frontend/src/api.ts`

**Out of scope:**
- Reordering cards across columns (that is column-move, already working)
- Drag handle visual changes (existing handle is sufficient)
- Position display (no visible position number on card)
- Multi-card selection or bulk reorder
- Activity feed entry for reorder events (not a user-meaningful event for the activity feed at this stage)

---

## Test Strategy

### Approach

- **Emphasis**: Integration tests (backend supertest) + unit tests (frontend `onDragEnd` logic)
- **Target test count**: 12–16 tests total (7–9 backend, 5–7 frontend)
- **No E2E** at this stage (Level 2; UAT via browser is recommended, not mandatory)

### File Organization

| Action | File | Reason |
|--------|------|--------|
| **Extend existing** | `backend/src/__tests__/card.test.ts` | Add `PATCH /cards/:id/position` tests alongside existing `POST /cards` tests — same domain, same mock pattern |
| **New file** | `frontend/src/__tests__/Board.reorder.test.tsx` | `Board.tsx` has no test file yet; isolate reorder tests from any future general Board tests |

### What NOT to Test

| Item | Reason |
|------|--------|
| `@hello-pangea/dnd` drag mechanics (mouse events, pointer events, keyboard drag) | Covered by the library's own test suite; testing them here would be brittle and redundant |
| DB migration SQL syntax (`004_add_card_position.sql`) | Verified at container startup via `migrate.ts`; not a unit-testable concern |
| `ORDER BY position` on a real DB | The repository test uses a mocked `pool`; SQL ordering correctness is validated by integration smoke test / UAT |
| CSS visual position in the column | Not testable via jest/vitest; covered by UAT |
| Activity feed entries for reorder | Out of scope (see Scope Boundaries) |

### Per-Phase Test Guidance

**Phase 1 — DB + Backend (7–9 tests, extend `card.test.ts`):**

1. `PATCH /cards/:id/position` returns **200** with the updated card when position is valid
2. `PATCH /cards/:id/position` returns **400** when `position` is missing from body
3. `PATCH /cards/:id/position` returns **400** when `position` is not a non-negative integer (e.g., `"abc"`, `-1`, `1.5`)
4. `PATCH /cards/:id/position` returns **404** when card ID does not exist
5. `PATCH /cards/:id/position` returns **500** on unexpected repository error (mock `reorderCard` to reject)
6. `GET /cards` returns cards; verify `mockedRepo.getCards` was called (ordering is repo responsibility, not controller responsibility — test the contract, not the SQL)
7. *(Optional)* Repository unit: `reorderCard` calls `pool.query` with a transaction containing the correct UPDATE statements — mock `pool` directly

**Phase 2 — Frontend (5–7 tests, new `Board.reorder.test.tsx`):**

Tests should render `Board` with a mocked `api` module (`vi.mock('../api')`) and simulate `onDragEnd` calls directly (no real DnD events):

1. Same-column drop at different index → `cards` state array is reordered optimistically (verify via rendered DOM order)
2. Same-column drop at same index → no state change, `reorderCard` not called
3. Same-column drop → `reorderCard(cardId, newPosition)` is called with correct arguments
4. `reorderCard` rejects → cards array reverts to pre-drag order; no crash
5. Cross-column drop → `columnId` is updated; `reorderCard` is NOT called (regression guard for AC-HAPPY-3)
6. *(Optional)* Filter active + same-column reorder → full `cards` array reordered correctly; filtered view still shows only matching cards after reorder (AC-ENTRY-2)

---

## Implementation Roadmap

### [x] Phase 1: DB migration + backend position field + reorder endpoint

**Deliverables:**
- `backend/src/db/migrations/004_add_card_position.sql` — adds `position INTEGER NOT NULL DEFAULT 0` to `cards` table; backfills existing rows with `ROW_NUMBER() OVER (PARTITION BY column_id ORDER BY created_at)` so existing cards get stable initial positions
- `backend/src/types/card.types.ts` — add `position: number` to `Card` interface; add `ReorderCardDto { position: number }` interface
- `backend/src/repositories/card.repository.ts`:
  - Update `getCards()`: change `ORDER BY c.created_at DESC` → `ORDER BY c.position ASC, c.created_at ASC`; include `c.position` in SELECT and `rowToCard` mapping
  - Add `reorderCard(id: string, newPosition: number): Promise<Card>` — atomic transaction: (a) clamp `newPosition` to valid range for the card's column, (b) shift other cards in same column to close the gap, (c) set `position = newPosition` on the target card
- `backend/src/services/card.service.ts` — add `reorderCard(id: string, position: number): Promise<Card>` with validation: `position` must be a non-negative integer; delegate to `cardRepository.reorderCard`
- `backend/src/controllers/card.controller.ts` — add `reorderCardPosition(req, res)` handler; extract `id` from `req.params`, `position` from `req.body`; catch `ValidationError` → 400, `NotFoundError` → 404
- `backend/src/routes/card.routes.ts` — add `router.patch('/:id/position', reorderCardPosition)`
- `backend/src/__tests__/card.test.ts` — extend with Phase 1 tests (7–9 tests per Test Strategy)

**Completion gate**: `npm test` in `backend/` passes all tests including new ones.

---

### [x] Phase 2: Frontend onDragEnd same-column reorder + persist

**Deliverables:**
- `frontend/src/api.ts` — add `reorderCard(cardId: string, position: number): Promise<void>` calling `PATCH /cards/:id/position`
- `frontend/src/components/Board.tsx` — update `onDragEnd`:
  - After the early-exit guard (line 58), add a same-column reorder branch: when `destination.droppableId === source.droppableId && destination.index !== source.index`:
    1. Optimistically reorder the `cards` array: remove the card from `source.index` in that column's card list, insert at `destination.index`, preserve cards from other columns unchanged
    2. Call `await reorderCard(draggableId, destination.index)` (fire-and-forget with error handling)
    3. On catch: revert `cards` state to the snapshot taken before the optimistic update; set an appropriate error state (reuse the existing `cardCreateError` state pattern, or introduce a `reorderError` state)
  - The column-move branch and activity feed logic must remain untouched
  - **Filter edge case (AC-ENTRY-2)**: The reorder must operate on the full `cards` array (React state), not on `filteredCards`. Use the `source.index` and `destination.index` values from the `DropResult` — these are indices within the **rendered** column (which may be filtered). When a filter is active, the drag indices correspond to positions in `filteredCards`, so the implementation must map filtered indices back to the full `cards` array. See implementation note below.
- `frontend/src/__tests__/Board.reorder.test.tsx` — new file with Phase 2 tests (5–7 tests per Test Strategy)

**Filter index mapping note (AC-ENTRY-2):** When `activeFilter` is set, `Column` renders `filteredCards.filter(c => c.columnId === col.id)`. The `source.index` and `destination.index` from `DropResult` are indices within that filtered subarray. To reorder in the full `cards` array correctly: (1) build the ordered list of full-array card IDs for that column (from `filteredCards` since they reflect what was rendered), (2) splice the dragged card to its new index in that list, (3) apply the new column ordering to the full `cards` array while leaving other-column cards in place. This ensures hidden (filtered-out) cards are unaffected.

**Completion gate**: `npm test` in `frontend/` passes all tests including new ones; manual smoke test confirms same-column drag reorders and persists after page refresh.

---

## Creative Phases

N/A — specification is concrete, no design exploration needed

---

## Execution State

**Build Status**: COMPLETE
**Current Build**: Phase 2: Frontend onDragEnd same-column reorder + persist (TASK-009)
**Build Started**: 2026-06-17
**Phase Number**: 2 of 2
**Is Multi-Phase**: YES

### Current Build Step
**Step**: Phase 2 COMPLETE — all tests passing
**Status**: COMPLETE

### Completed Steps
- [x] Spec Writer Agent: specification, test strategy, and implementation roadmap written
- [x] Phase 1: DB migration + backend (65 tests passing, commit ec749a5)
- [x] Phase 2: Frontend reorder — 81/81 tests passing, build ✓, lint ✓

### Sub-Agents
(none)

### Resumption Notes
**Can Resume**: NO
**Resume From**: /banyan-reflect TASK-009
