# Archive: TASK-009 Card Reordering

**Task**: TASK-009 - Card Reordering
**Feature**: FEAT-008
**Complexity**: Level 2
**Branch**: feature/FEAT-008-card-reordering
**Completed**: 2026-06-17
**Archive Date**: 2026-06-17

---

## Summary

Implemented same-column card reordering via drag-and-drop on the BanyanBoard Kanban board. Added a `position` INTEGER column to the `cards` table, a `PATCH /cards/:id/position` endpoint with atomic DB transaction, and updated the frontend `onDragEnd` handler to perform optimistic reorder with revert-on-failure. All 7 acceptance criteria met. 65 backend + 81 frontend tests passing.

---

## Acceptance Criteria Results

| AC | Status | Implementation |
|----|--------|----------------|
| AC-ENTRY-1: Drag in same column, no jump-back | ✅ PASS | `Board.tsx` same-column branch with optimistic `setCards` |
| AC-ENTRY-2: Filter active — hidden cards retain order | ✅ PASS | `visibleIdSet` pattern in `Board.tsx` lines 66–78 |
| AC-HAPPY-1: Immediate optimistic update, no flicker | ✅ PASS | Synchronous `setCards` before async API call |
| AC-HAPPY-2: Order persists after page refresh | ✅ PASS | `GET /cards` orders by `position ASC, created_at ASC` |
| AC-HAPPY-3: Cross-column drag unchanged | ✅ PASS | Same-column branch isolated; regression test passes |
| AC-ERROR-1: API failure reverts to pre-drag order | ✅ PASS | `snapshot = cards` before dispatch; `.catch(() => setCards(snapshot))` |
| AC-ERROR-2: Concurrent reorders — atomic transaction | ✅ PASS | `card.repository.ts` uses single DB transaction |
| AC-VERIFY-1: `GET /cards` ordered by `position ASC, created_at ASC` | ✅ PASS | Repository query updated; `created_at` as stable tiebreaker |

---

## Implementation Phases

### Phase 1: DB Migration + Backend (commit ec749a5)

**Files delivered:**
- `backend/src/db/migrations/004_add_card_position.sql` — `ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`; backfills with `ROW_NUMBER() OVER (PARTITION BY column_id ORDER BY created_at ASC) - 1`
- `backend/src/types/card.types.ts` — added `position: number` to `Card`; added `ReorderCardDto { position: number }`
- `backend/src/repositories/card.repository.ts` — updated `getCards()` ordering (`position ASC, created_at ASC`); added `reorderCard()` with atomic BEGIN/UPDATE/COMMIT transaction
- `backend/src/services/card.service.ts` — added `reorderCard()` with non-negative integer validation; throws `ValidationError` on bad input, `NotFoundError` on missing card
- `backend/src/controllers/card.controller.ts` — added `reorderCardPosition()` handler; `ValidationError` → 400, `NotFoundError` → 404
- `backend/src/routes/card.routes.ts` — `router.patch('/:id/position', reorderCardPosition)`
- `backend/src/__tests__/card.test.ts` — extended with 9 new tests (200 valid, 400 missing body, 400 invalid types, 404 not found, 500 repo error, GET contract)

**Test results**: 65/65 passing
**Build**: PASS (tsc), Typecheck: CLEAN

---

### Phase 2: Frontend onDragEnd + Tests (commit 111b57b)

**Files delivered:**
- `frontend/src/api.ts` — added `reorderCard(cardId: string, position: number): Promise<void>` calling `PATCH /cards/:id/position`
- `frontend/src/components/Board.tsx` — updated `onDragEnd`: same-column branch with `visibleIdSet` filter-mapping (AC-ENTRY-2), optimistic `setCards`, async `reorderCard` call, `.catch(() => setCards(snapshot))` revert, `cardCreateError` reused for reorder failure message
- `frontend/src/__tests__/Board.reorder.test.tsx` — new file with 7 tests: `makeSameColDrop`/`makeCrossColDrop` helpers; covers optimistic reorder, no-op guard, API args, revert on failure, cross-column regression, filter-active edge case

**Test results**: 81/81 passing
**Build**: PASS (vite), Lint: PASS (eslint)

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Atomic DB transaction for reorder | Concurrent writes cannot leave `position` values inconsistent — one transaction reads-and-writes all affected rows |
| 0-based `position` = DnD `destination.index` | No conversion at the API boundary; position value equals the index the drag library reports |
| `visibleIdSet` for filter index mapping | Readable O(n) approach; avoids manual index arithmetic for filtered→full-array mapping |
| Snapshot rollback (`const snapshot = cards`) | Consistent with TASK-007 pattern; single `setCards(snapshot)` is the complete revert |
| Reuse `cardCreateError` for reorder errors | Avoids new state variable; acceptable for MVP (documented limitation: two optimistic ops can stomp each other's errors) |
| `ADD COLUMN IF NOT EXISTS` in migration | Idempotent migration — safe to re-run |
| `ROW_NUMBER() - 1` backfill | Zero-indexed positions match DnD 0-based indices from day one |

---

## Test Coverage

| File | Tests Added | Suite Total |
|------|-------------|-------------|
| `backend/src/__tests__/card.test.ts` | 9 | 65 |
| `frontend/src/__tests__/Board.reorder.test.tsx` | 7 (new file) | 81 |
| **Total new tests** | **16** | |

Target range was 12–16. Hit upper end of range.

---

## Lessons Learned

### Applied Learned Rules (from prior tasks)
- `testing-patterns.md` — DnD mock via captured `onDragEnd` closure: used directly in `Board.reorder.test.tsx`
- `testing-patterns.md` — Write rollback test before async path: AC-ERROR-1 test written first
- `testing-patterns.md` — Scope queries to named landmark regions: `within(todoCol)` / `within(doneCol)` throughout
- `architecture.md` — Atomic rollback via single `setState`: `setCards(snapshot)` single call
- `architecture.md` — `ValidationError` in service layer: `card.service.ts` validates position, throws to controller

### Extracted Learnings (new rules)
- `frontend-architecture.md` — `visibleIdSet` splice pattern for filtered-list reorder (filter×mutation edge case)
- `architecture.md` — Cross-feature filter×mutation interactions must be explicit ACs in spec
- `architecture.md` — Shared `role="alert"` reuse limit: document at 2 ops, upgrade at 3rd

### Ecosystem Insight
The Spec Writer Agent's pre-identification of the filter index mapping edge case (AC-ENTRY-2) was the single biggest quality multiplier. A non-obvious interaction between label filtering and DnD state was captured as a concrete AC with an implementation note before any code was written — preventing a data-corruption bug from reaching the build phase.

---

## Reflection Reference

Full reflection: `memory-bank/reflection/reflection-TASK-009.md`
- **Task Quality**: Excellent
- **Ecosystem Effectiveness**: Highly Effective
