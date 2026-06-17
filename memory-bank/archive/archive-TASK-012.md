# Archive: TASK-012 — Card Deletion

**Archived**: 2026-06-17
**Complexity**: Level 2
**Status**: COMPLETE
**Roadmap**: FEAT-009
**Branch**: feature/FEAT-009-card-deletion

---

## Summary

Added permanent card deletion to the kanban board. A "Delete" button in each card's footer opens a confirmation dialog (`DeleteCardDialog`) warning the action cannot be undone. Confirming triggers an optimistic remove from board state, a `DELETE /cards/:id` API call, and a `'deleted'` activity feed entry. API failure reverts the optimistic remove and shows an error banner.

**Backend**: `DELETE /cards/:id` endpoint — route + controller + service + repository + 7 tests.
**Frontend**: `DeleteCardDialog` component + Card delete button + Board handler + `'deleted'` ActivityFeedEntry variant + 6 tests.

---

## Implementation Phases

### Phase 1: Backend `DELETE /cards/:id`

**Commit**: `3d5920d feat(TASK-012): Phase 1 — backend DELETE /cards/:id`

**Files delivered**:
- `backend/src/repositories/card.repository.ts` — `deleteCard(id)`: `DELETE FROM cards WHERE id = $1`; throws `NotFoundError` if `rowCount === 0`
- `backend/src/services/card.service.ts` — `deleteCard(id)`: delegates to repository
- `backend/src/controllers/card.controller.ts` — `deleteCard`: calls service, sends 204; dual `instanceof`/`.name` guard for `NotFoundError`
- `backend/src/routes/card.routes.ts` — `router.delete('/:id', deleteCard)`
- `backend/src/__tests__/card.test.ts` — new file, 7 tests

**Tests**: 72/72 PASS (65 existing + 7 new)
**Typecheck**: CLEAN

### Phase 2: Frontend Card Deletion UI

**Commit**: `6ee2d11 feat(TASK-012): Phase 2 — frontend card deletion`

**Files delivered**:
- `frontend/src/types.ts` — added `{ id: string; kind: 'deleted'; cardTitle: string; timestamp: Date }` to `ActivityFeedEntry` union
- `frontend/src/api.ts` — `deleteCard(id: string): Promise<void>` (`DELETE /cards/:id`, throws on non-2xx)
- `frontend/src/components/DeleteCardDialog.tsx` — new component: `role="dialog"`, `aria-modal`, `useFocusTrap`, `ReactDOM.createPortal` into `document.body`, `modal-backdrop`, card title, "This action cannot be undone" warning, Cancel / Delete permanently buttons, container-scoped Escape listener
- `frontend/src/components/Card.tsx` — added `onDelete` prop, "Delete" button in `card-footer` with `aria-label="Delete [card title]"`, local `showDeleteDialog` state
- `frontend/src/components/Column.tsx` — prop-threads `onDeleteCard` to `Card` (same pattern as `onLabelToggle`)
- `frontend/src/components/Board.tsx` — `onDeleteCard(cardId)`: optimistic remove from `cards` state + activity feed `'deleted'` entry, `deleteCard` API call, rollback + `cardDeleteError` banner on failure
- `frontend/src/components/ActivityFeed.tsx` — renders `kind === 'deleted'` entries as "[cardTitle] deleted"
- `frontend/src/__tests__/Card.delete.test.tsx` — new file, 5 tests
- `frontend/src/__tests__/Board.test.tsx` — extended with 2 `onDeleteCard` tests

**Tests**: 91/91 PASS (84 existing + 7 new)
**Typecheck**: CLEAN
**Lint**: PASS

---

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-ENTRY-1 | Delete button visible on every card with correct `aria-label` | ✅ |
| AC-HAPPY-1 | Full delete flow: dialog opens, confirm triggers optimistic remove + API call + feed entry | ✅ |
| AC-HAPPY-2 | Cancel/Escape closes dialog without API call or feed entry | ✅ |
| AC-ERROR-1 | API failure reverts optimistic remove and shows `role="alert"` error banner | ✅ |
| AC-ERROR-2 | `DELETE /cards/:id` with non-existent ID returns HTTP 404 `{ "error": "Card not found: [id]" }` | ✅ |

---

## Test Coverage

| File | Tests | Coverage |
|------|------:|---------|
| `backend/src/__tests__/card.test.ts` | 7 | 204 success, 404 not-found, 400 invalid UUID, repo delete, post-delete verify, service delegation, controller 204 |
| `frontend/src/__tests__/Card.delete.test.tsx` | 5 | Delete button render, dialog open, Cancel closes without `onDelete`, Escape closes without `onDelete`, confirm calls `onDelete(cardId)` |
| `frontend/src/__tests__/Board.test.tsx` | +2 | Optimistic remove path, revert-on-API-error path |

**Total new tests**: 13 of 12–14 target. All pass.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| `ReactDOM.createPortal` for `DeleteCardDialog` | Escapes Draggable CSS transform stacking context — same reason as `LabelPickerPopover` |
| Container-scoped Escape listener | Prevents intercepting dnd keyboard drag-cancel handler |
| Local `showDeleteDialog` state in `Card.tsx` | Dialog lifecycle fully encapsulated in card; no board-level programmatic control needed |
| `ON DELETE CASCADE` for `card_labels` | Database-level guarantee; no application-layer explicit delete needed |
| Frontend-only activity feed entry | Consistent with existing feed pattern; no backend activity table in MVP |

---

## Learned Rules Applied

- `testing-patterns.md` — rollback test before async path (Board rollback test)
- `testing-patterns.md` — dual `instanceof`/name guard for custom errors (deleteCard controller)
- `frontend-architecture.md` — ReactDOM portal for dnd-adjacent modal (DeleteCardDialog)
- `frontend-architecture.md` — Escape listener scoped to container (DeleteCardDialog)
- `architecture.md` — atomic rollback via single `setState` (Board.onDeleteCard)
- `architecture.md` — shared `role="alert"` limit documented with code comment

## New Learnings Extracted

- `testing-patterns.md` — Create `Component.concern.test.tsx` for new concerns vs. extending existing test file
- `frontend-architecture.md` — Local dialog state in Draggable child (Card) vs. lifting to Board
- `architecture.md` — Enumerate negative scope for destructive-action features in Scope Boundaries

---

## Reflection

**Quality**: Excellent — all 5 ACs met, 13/13 tests pass, zero rework, clean typecheck and lint, no scope creep, established patterns followed throughout.

**Ecosystem**: Highly Effective — Level 2 two-phase split natural (backend first, then frontend), 6 learned rules applied correctly, spec quality enabled pattern-assembly coding with zero discovery overhead.

Full reflection: `memory-bank/reflection/reflection-TASK-012.md`
