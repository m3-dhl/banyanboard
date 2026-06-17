# TASK-012: Card Deletion

**Complexity**: Level 2
**Status**: COMPLETE
**Reflection**: memory-bank/reflection/reflection-TASK-012.md
**Archived**: memory-bank/archive/archive-TASK-012.md
**Completed**: 2026-06-17
**Roadmap**: FEAT-009
**Branch**: feature/FEAT-009-card-deletion
**Worktree**: N/A

## Task Description

Cards currently cannot be deleted from the kanban board. This task adds permanent card deletion with an irreversible-action confirmation dialog following industry-standard patterns (Trello/Jira/Asana).

Pattern: delete trigger on card → AlertDialog with explicit warning that the action cannot be undone → confirmed DELETE /tasks/:id API call → card removed from board + activity feed logs the deletion.

**Backend**: DELETE /tasks/:id endpoint + repository method.
**Frontend**: Delete affordance on card + AlertDialog confirmation component.

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Dev Team Member — wants to remove completed, duplicate, or mistakenly created cards without requiring backend access or admin tools.
**Creative Exploration Needed**: No

### Invocation Method

- **Location**: `frontend/src/components/Card.tsx` — the card `<div>` rendered inside `<Draggable>` in `frontend/src/components/Column.tsx`
- **Element**: A "Delete" `<button>` added to the existing `card-footer` div alongside the existing "+ Label" button (`addLabelBtnRef`). Renders as a text button with class `delete-card-btn`, similar to the existing `add-label-btn` style pattern.
- **Visibility**: Always visible in the card footer (same visibility as the "+ Label" button — no hover-only hiding required; board is small-team internal tool).
- **Navigation**: Board view → locate card in any column → click "Delete" in card footer → `DeleteCardDialog` confirmation dialog opens (rendered via `ReactDOM.createPortal` into `document.body`, per the existing portal pattern in `LabelPickerPopover.tsx`) → user reads irreversibility warning → clicks "Delete permanently" to confirm, or "Cancel" to dismiss.
- **Confidence**: HIGH — `Card.tsx` footer pattern and portal pattern (`createPortal`) are both already established in `LabelPickerPopover.tsx`; dialog/modal pattern is established in `LabelManagementPanel.tsx` with `role="dialog"`, `modal-backdrop`, and `useFocusTrap`.

### Success Criteria

- **User sees**: Card is instantly removed from the column. Activity feed gains a new top entry reading "[card title] deleted" with a relative timestamp.
- **Verifiable at**: Board view — the deleted card no longer appears in any column. Activity feed (`frontend/src/components/ActivityFeed.tsx`, `role="log"`) announces the deletion.
- **Data persisted**: Row deleted from `cards` table in PostgreSQL. Associated `card_labels` rows deleted (cascade or explicit delete in repository). Activity feed entry added to frontend state only (no backend activity table exists yet).
- **Observable within**: Immediate — optimistic delete applied to `cards` state in `Board.tsx` before the API call resolves, reverted with an error banner on failure (matching the existing `onAddCard` rollback pattern in `Board.tsx`).

### Acceptance Criteria

#### AC-ENTRY-1: Delete button is present and labelled on every card
**Priority**: MUST
**Given** the kanban board is loaded and at least one card exists in any column
**When** the user looks at the card footer area
**Then** a "Delete" button is visible with `aria-label="Delete [card title]"`, positioned in the `card-footer` div alongside the existing "+ Label" button

#### AC-HAPPY-1: User permanently deletes a card after confirming the irreversible-action dialog
**Priority**: MUST
**Given** a card exists on the board
**When** the user:
  1. Clicks the "Delete" button on the card
  2. Reads the `DeleteCardDialog` which shows: the card title, the warning text "This action cannot be undone", and two buttons: "Cancel" and "Delete permanently"
  3. Clicks "Delete permanently"
**Then**:
  - The dialog closes
  - The card is removed from the board immediately (optimistic update)
  - `DELETE /cards/:id` is called and returns HTTP 204
  - The activity feed gains a new top entry: "[card title] deleted" with a relative timestamp
  - The `cards` state in `Board.tsx` no longer contains the deleted card

#### AC-HAPPY-2: Cancelling the dialog leaves the card untouched
**Priority**: MUST
**Given** the `DeleteCardDialog` is open for a card
**When** the user clicks "Cancel" (or presses Escape)
**Then**:
  - The dialog closes
  - The card remains on the board exactly as it was
  - No API call is made
  - No activity feed entry is added

#### AC-ERROR-1: API failure during deletion reverts the optimistic update and shows an error banner
**Priority**: MUST
**Given** the user confirmed deletion and `DELETE /cards/:id` returns a non-2xx status (e.g., 404 or 500)
**When** the fetch promise rejects or the response is not ok
**Then**:
  - The card reappears in its original column and position (state reverted)
  - The activity feed entry for this deletion is removed (reverted, matching the `onAddCard` rollback pattern)
  - A `role="alert"` error banner appears in the board header with text "Failed to delete card — please try again" (matching the existing `cardCreateError` banner pattern in `Board.tsx`)

#### AC-ERROR-2: DELETE /cards/:id returns 404 when the card does not exist
**Priority**: MUST
**Given** a `DELETE /cards/:id` request is made with an ID that does not exist in the database
**When** the backend processes the request
**Then** the response is HTTP 404 with body `{ "error": "Card not found: [id]" }` (using the existing `NotFoundError` class from `backend/src/errors/index.ts`)

### Scope Boundaries

- **In scope**:
  - Backend: `DELETE /cards/:id` endpoint — new route in `backend/src/routes/card.routes.ts`, new controller function `deleteCard` in `backend/src/controllers/card.controller.ts`, new service function `deleteCard` in `backend/src/services/card.service.ts`, new repository function `deleteCard` in `backend/src/repositories/card.repository.ts` (SQL: `DELETE FROM cards WHERE id = $1`)
  - Backend: `card_labels` cleanup — either CASCADE on the FK constraint (migration) or explicit `DELETE FROM card_labels WHERE card_id = $1` before deleting the card row
  - Frontend: `deleteCard(cardId)` function added to `frontend/src/api.ts` (`DELETE /cards/:id`, throws on non-2xx)
  - Frontend: New `DeleteCardDialog` component (`frontend/src/components/DeleteCardDialog.tsx`) — `role="dialog"`, `aria-modal="true"`, `useFocusTrap` from `frontend/src/hooks/useFocusTrap.ts`, rendered via `ReactDOM.createPortal` into `document.body`, `modal-backdrop` overlay, Escape key closes dialog (per `LabelManagementPanel.tsx` pattern)
  - Frontend: `onDeleteCard(cardId: string)` handler in `Board.tsx` — optimistic delete from `cards` state, activity feed entry `{ kind: 'deleted', cardTitle, timestamp }`, API call, revert on failure
  - Frontend: `Card.tsx` receives `onDelete: (cardId: string) => void` prop; "Delete" button in card footer opens `DeleteCardDialog` state local to `Card.tsx`
  - Frontend: `Column.tsx` passes `onDeleteCard` down to `Card` (prop threading, same pattern as `onLabelToggle`)
  - Frontend: New `'deleted'` variant added to `ActivityFeedEntry` union type in `frontend/src/types.ts`: `{ id: string; kind: 'deleted'; cardTitle: string; timestamp: Date }`
  - Frontend: `ActivityFeed.tsx` renders the new `'deleted'` entry kind as "[card title] deleted"
  - Backend tests: `backend/src/__tests__/card.test.ts` extended with `DELETE /cards/:id` cases
  - Frontend tests: `frontend/src/__tests__/Card.test.tsx` (new) — delete button renders, dialog appears, cancel works, confirm calls `onDelete`
- **Out of scope**:
  - Soft delete / archive — deletion is permanent, no recovery UI
  - Undo / undo toast — no undo mechanism
  - Backend activity log table — activity feed is frontend-only state (existing pattern)
  - Bulk deletion — single card at a time only
  - Cascading board/column deletion effects — only the card row and its `card_labels` join rows are removed
  - Auth/permission checks — no auth layer exists in MVP
- **Dependencies**:
  - `backend/src/errors/index.ts` — `NotFoundError` already exists, used by `deleteCard` controller
  - `frontend/src/hooks/useFocusTrap.ts` — already exists, used by `DeleteCardDialog`
  - `ReactDOM.createPortal` — already used in `LabelPickerPopover.tsx`; same pattern for `DeleteCardDialog`
- **NFR implications**:
  - **Accessibility**: `DeleteCardDialog` must use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the dialog heading, and `useFocusTrap`. Escape key must close the dialog without triggering `@hello-pangea/dnd` keyboard drag handlers (attach listener to container element, not `document`, per `LabelPickerPopover.tsx` pattern).
  - **Performance**: DELETE is a single-row operation; p95 < 200ms NFR easily met.
  - **WCAG 2.1 AA**: Focus returns to the "Delete" button that triggered the dialog after cancel/dismiss (handled by `useFocusTrap`'s `triggerRef` return-focus logic).

### Creative Exploration Needed

Specification is concrete — proceed to implementation planning.

## Test Strategy

### Approach
- **Emphasis**: Integration + unit balanced
- **Target test count**: 12-14

### File Organization
- **New test files**: `backend/src/__tests__/card.test.ts` — DELETE /cards/:id endpoint (no card tests exist yet)
- **New test files**: `frontend/src/__tests__/Card.delete.test.tsx` — delete button, dialog, cancel, confirm
- **Extend existing**: `frontend/src/__tests__/Board.test.tsx` — onDeleteCard handler, optimistic revert on error

### What NOT to Test
- Dialog animation/styling — component framework concern
- `card_labels` cascade — FK `ON DELETE CASCADE` confirmed in migration, DB-level guarantee
- `useFocusTrap` behavior — already tested by existing pattern via `LabelManagementPanel`

### Per-Phase Test Guidance
- Phase 1 (Backend — `card.test.ts`): 7 tests
  - `DELETE /cards/:id` → 204 no content
  - `DELETE /cards/:id` with non-existent ID → 404 `{ error: "Card not found: [id]" }`
  - `DELETE /cards/:id` with invalid UUID → 400
  - Repository `deleteCard` deletes row from `cards` table
  - Repository `deleteCard` verifies card gone after delete
  - Service `deleteCard` calls repository
  - Controller `deleteCard` returns 204 on success
- Phase 2 (Frontend): 6 tests
  - `Card.tsx` renders "Delete" button with correct `aria-label`
  - Clicking "Delete" opens `DeleteCardDialog`
  - "Cancel" closes dialog, does not call `onDelete`
  - Escape closes dialog, does not call `onDelete`
  - "Delete permanently" calls `onDelete(cardId)`
  - `Board.tsx` `onDeleteCard`: optimistic remove → API call → revert + error banner on failure

## Implementation Roadmap

- [x] Phase 1: Backend `DELETE /cards/:id` — route + controller + service + repository + tests
- [x] Phase 2: Frontend `DeleteCardDialog` + card delete button + Board handler + `'deleted'` feed entry + tests

### Phase 1 — Backend (files to touch)
- `backend/src/repositories/card.repository.ts` — add `deleteCard(id: string): Promise<void>` (SQL: `DELETE FROM cards WHERE id = $1`; throw `NotFoundError` if rowCount === 0)
- `backend/src/services/card.service.ts` — add `deleteCard(id: string): Promise<void>` delegating to repo
- `backend/src/controllers/card.controller.ts` — add `deleteCard`: calls service, sends 204
- `backend/src/routes/card.routes.ts` — add `router.delete('/:id', deleteCard)`
- `backend/src/__tests__/card.test.ts` — new file, 7 tests

### Phase 2 — Frontend (files to touch)
- `frontend/src/types.ts` — add `{ id: string; kind: 'deleted'; cardTitle: string; timestamp: Date }` to `ActivityFeedEntry` union
- `frontend/src/api.ts` — add `deleteCard(id: string): Promise<void>` (`DELETE /cards/:id`, throw on non-2xx)
- `frontend/src/components/DeleteCardDialog.tsx` — new component; `role="dialog"`, `aria-modal`, `useFocusTrap`, portal, modal-backdrop, card title, irreversibility warning, Cancel / Delete permanently buttons
- `frontend/src/components/Card.tsx` — add `onDelete: (cardId: string) => void` prop; "Delete" button in `card-footer`; local `showDeleteDialog` state
- `frontend/src/components/Column.tsx` — pass `onDeleteCard` down to `Card` (same pattern as `onLabelToggle`)
- `frontend/src/components/Board.tsx` — add `onDeleteCard(cardId)`: optimistic remove, `deleteCard` API call, rollback + `cardDeleteError` banner on failure; pass down through Column
- `frontend/src/components/ActivityFeed.tsx` — render `kind === 'deleted'` entries as "[cardTitle] deleted"
- `frontend/src/__tests__/Card.delete.test.tsx` — new file, 6 tests
- `frontend/src/__tests__/Board.test.tsx` — extend with `onDeleteCard` tests

### API Requirements
- **REST API**: Yes → `DELETE /cards/:id` following existing REST patterns
- Load `${CLAUDE_PLUGIN_ROOT}/context/api-rest-requirements.md` during build

### Observability Requirements
- **Applies**: No — no new HTTP server entry points or external calls beyond existing card API pattern

## Creative Phases

(none)

---

## Execution State

**Build Status**: IDLE
**Current Phase**: COMPLETE
**Current Step**: COMPLETE
**Can Resume**: NO

### Active Sub-Agents
- Reflection Agent: COMPLETE, 2026-06-17 — Output: memory-bank/reflection/reflection-TASK-012.md

### Completed Steps
- Step 3 - Spec Writer Agent - COMPLETE
- Step 4 - Human Spec Review - APPROVED
- PLANNING_COMPLETE
- Step 0.5 Git Setup - COMPLETE (branch: feature/FEAT-009-card-deletion)
- Phase 1 - All steps - COMPLETE (72 backend tests)
- Phase 2 - Step 3 Test Writer - COMPLETE (5 Card.delete tests + 2 Board tests)
- Phase 2 - Step 4 Coding Agent - COMPLETE (DeleteCardDialog, Card, Column, Board, ActivityFeed, api, types)
- Phase 2 - Step 7 Integration Verification - COMPLETE (91/91 frontend + 72/72 backend, typecheck+lint clean)
- Phase 2 - Step 11 Git Completion - COMPLETE
