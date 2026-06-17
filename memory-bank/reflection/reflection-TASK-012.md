# Reflection: TASK-012 — Card Deletion

**Date**: 2026-06-17
**Complexity**: Level 2
**Duration**: 1 session (2 phases)
**Outcome**: COMPLETE

---

## 1. Task Implementation Quality

### Requirements Coverage

All 5 acceptance criteria were met:

- **AC-ENTRY-1**: Delete button rendered in `card-footer` with `aria-label="Delete [card title]"` on every card — confirmed by test.
- **AC-HAPPY-1**: Full flow implemented — dialog opens with card title + "This action cannot be undone" + Cancel/Delete permanently buttons; confirm triggers optimistic remove, `DELETE /cards/:id` → 204, activity feed `'deleted'` entry.
- **AC-HAPPY-2**: Cancel and Escape both close the dialog without calling `onDelete` or adding a feed entry — confirmed by dedicated tests.
- **AC-ERROR-1**: API failure reverts the optimistic remove, removes the activity entry, and shows a `role="alert"` error banner `cardDeleteError` in Board header.
- **AC-ERROR-2**: Backend returns HTTP 404 `{ "error": "Card not found: [id]" }` via the existing `NotFoundError` class.

No gaps. No extras beyond spec scope (soft delete, undo, bulk delete all correctly stayed out of scope).

### Code Quality Assessment

The implementation followed established project patterns faithfully throughout:

- `DeleteCardDialog` mirrors `LabelManagementPanel` for the modal structure (`role="dialog"`, `aria-modal`, `useFocusTrap`, `ReactDOM.createPortal`, `modal-backdrop`, container-scoped Escape listener).
- `onDeleteCard` in `Board.tsx` mirrors the existing `onAddCard` rollback pattern — optimistic state change, API call, single `setState` rollback on failure.
- Prop threading in `Column.tsx` follows the `onLabelToggle` pattern exactly.
- `'deleted'` ActivityFeedEntry variant is a clean discriminated union extension to `types.ts`.
- `card_labels` cleanup is handled by the existing FK `ON DELETE CASCADE` constraint rather than application-layer explicit deletes — correct choice that avoids double-delete logic.
- No observability violations (no `console.log` in production paths).

### Test Coverage

13 tests delivered (target was 12–14):
- 7 backend integration/unit tests covering 204 success, 404 not-found, 400 invalid UUID, repository delete, post-delete verification, service delegation, and controller 204.
- 5 `Card.delete.test.tsx` tests: button render with correct `aria-label`, dialog open on click, Cancel closes without calling `onDelete`, Escape closes without calling `onDelete`, "Delete permanently" calls `onDelete(cardId)`.
- 2 `Board.test.tsx` extensions: optimistic remove path and revert-on-API-error path.

Coverage is thorough. The decision to put dialog-interaction tests in `Card.delete.test.tsx` (separate file) rather than extending the existing `Card.test.tsx` was good hygiene — keeps the delete concern isolated and avoids polluting the existing test file's query scope. The rollback test was written before the async path implementation (existing learned rule applied correctly).

### Technical Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Local `showDeleteDialog` state in `Card.tsx` (not lifted to `Board`) | Keeps dialog lifecycle scoped to the card that owns it; matches `LabelPickerPopover` precedent | Cannot batch-dismiss all open dialogs from Board, but irrelevant for single-card UX |
| `ReactDOM.createPortal` for `DeleteCardDialog` | Required to escape Draggable stacking context, matching portal pattern already learned | Slightly harder to test without jsdom portal setup, but existing test infrastructure handles it |
| Frontend-only activity feed entry (no backend persistence) | Out of scope per spec, consistent with existing feed pattern | Activity feed resets on page reload — acceptable for MVP |
| `ON DELETE CASCADE` for `card_labels` cleanup | Database-level guarantee, no application code needed | Less visible in app code, but documented in spec scope boundaries |

### What Went Well

- Zero rework across both phases. Phase 1 and Phase 2 each completed with tests passing in a single pass.
- The spec was precise enough to begin coding immediately — invocation location, component file, portal pattern, prop threading, and rollback pattern were all specified with concrete file references.
- Existing patterns (`useFocusTrap`, portal, rollback) were so well-established that `DeleteCardDialog` was essentially a guided assembly rather than a design decision.
- The `activity feed 'deleted' variant` required only one union type extension and one `ActivityFeed.tsx` render branch — minimal touch footprint.

### What Could Be Improved

- The task file spec says `DELETE /tasks/:id` in the Task Description section (line 15) but `DELETE /cards/:id` everywhere else. This is a copy-paste error from a task template or earlier draft. It caused no implementation confusion because the spec detail sections are consistent, but it is a minor spec hygiene issue.
- The execution state section records `Build Status: RUNNING` at reflect time rather than `BUILD_COMPLETE` — a minor state-tracking slip. Reflect was triggered before the status field was updated.

**Rating**: Excellent — all 5 ACs met, 13/13 tests pass, zero rework, clean typecheck and lint, no scope creep, established patterns followed throughout.

---

## 2. Claude Code Ecosystem Effectiveness

### Workflow Fit

Level 2 workflow (plan → build Phase 1 → build Phase 2 → reflect → archive) was an excellent fit. The two-phase split was natural: backend first gave a working DELETE endpoint to test against before the frontend was built. The phase boundary was clean — Phase 1 had no frontend coupling and Phase 2 could integrate against the completed API contract. For a feature of this size, Level 2 is the right classification; Level 3 would have been over-engineered.

### Memory Bank Usefulness

The task file was the primary reference during implementation. The spec section's concrete file references (`frontend/src/hooks/useFocusTrap.ts`, `LabelPickerPopover.tsx`, `LabelManagementPanel.tsx`) eliminated codebase discovery time. The `systemPatterns.md` and `techContext.md` were not needed — the task file contained sufficient cross-links. `productBrief.md` was not consulted for Level 2 as expected.

### Sub-Agent Performance

- **Spec Writer Agent**: Delivered a high-quality spec that was approved without revision. The invocation method section was especially useful — it identified the exact files to follow as patterns (`LabelPickerPopover`, `LabelManagementPanel`) rather than describing the pattern abstractly.
- **Test Writer Agent**: Produced 13 well-targeted tests. Decision to separate `Card.delete.test.tsx` from `Card.test.tsx` was a good call that matches existing test hygiene.
- **Coding Agent**: Implemented both phases without rework. Applied existing learned rules (rollback-test-first, container-scoped Escape, portal) correctly.

### Learned Rules Application

Rules applied during this task:

- **testing-patterns.md** — "Write rollback test before implementing async optimistic-update" was applied in Phase 2 Board tests.
- **frontend-architecture.md** — "ReactDOM.createPortal for dnd-adjacent popover" and "Scope Escape key listener to container element" were both applied in `DeleteCardDialog`.
- **architecture.md** — "For optimistic UI updates that touch multiple state arrays, derive rollback from UUID and filter in single setState" was applied in `Board.onDeleteCard` (though this task only touches one array — `cards` — the single-setState discipline was maintained).
- **architecture.md** — "When a single role='alert' is reused for multiple independent optimistic operations, document the limit with a code comment" was applied: `cardDeleteError` was added as a second `role="alert"` alongside `cardCreateError`, and the code comment documenting the two-alert limit was carried forward.

All four applied rules demonstrably guided correct implementation choices. No applied rule led to a wrong turn.

### Suggested Ecosystem Improvements

- The spec writer could cross-check the Task Description section against the spec detail sections to catch inconsistencies (e.g., the `/tasks/:id` vs `/cards/:id` mismatch noted above). A single-pass consistency lint in the Spec Writer Agent's output pass would catch these.
- The Execution State `Build Status` field update could be automated as a post-step in the build command's completion step rather than relying on the agent to remember to update it before triggering reflect.

**Rating**: Highly Effective — two clean build phases, all learned rules applied correctly, spec quality high enough that coding was essentially pattern assembly.

---

## 3. Key Learnings

### What This Task Reinforced

- **Portal pattern for dnd-adjacent modals** (frontend-architecture.md): `DeleteCardDialog` is the second confirmed instance of a modal/popover that must portal into `document.body` to escape the Draggable stacking context.
- **Container-scoped Escape listener** (frontend-architecture.md): Applied again without incident in `DeleteCardDialog`.
- **Rollback-test-first for optimistic updates** (testing-patterns.md): Applied in Phase 2, Board rollback test written before async path — test pinned state shape correctly on first attempt.
- **Dual instanceof/name guard** (testing-patterns.md): Applied in backend controller for `NotFoundError` — necessary because Jest module isolation can break `instanceof` across test boundaries.
- **Single-setState atomic rollback** (architecture.md): Applied in `onDeleteCard`, maintaining the discipline even for a single-array rollback.

### New Learnings

1. **Separate test file for a new component concern vs. extending existing**: When a new concern (card deletion) is added to an existing component (`Card.tsx`), creating a new test file (`Card.delete.test.tsx`) rather than extending the existing `Card.test.tsx` prevents query-scope conflicts and keeps test intent legible. This is a concrete application of the existing "scope queries to named regions" rule but the file-separation strategy is distinct enough to capture.

2. **Dialog triggered from a Draggable: local state in card vs. lifting to board**: Managing `showDeleteDialog` state locally inside `Card.tsx` (not lifted to `Board.tsx`) is the right default when the dialog lifecycle is fully encapsulated in the card — it matches `LabelPickerPopover`'s local state pattern and keeps `Board.tsx` free of dialog visibility concerns. Lifting dialog state to the board is only warranted if the board needs to programmatically close the dialog (e.g., on a board-level event), which does not arise in this task or in the label picker pattern.

3. **Irreversible-action spec completeness at Level 2**: For permanent-delete features, the spec benefits from explicitly listing what is NOT in scope (soft delete, undo, recovery UI) in the Scope Boundaries section. This was done in TASK-012 and it visibly prevented scope creep during both Phase 1 and Phase 2. For future destructive-action features, this negative-scope enumeration should be treated as a required spec element, not optional.

---

## 4. Extractable Learnings

### Learning 1: Separate test file for new concern on existing component
**Directive**: When adding a new user-facing concern to an existing component (e.g., deletion to Card), create a new `Component.concern.test.tsx` file rather than extending the existing test file — prevents query-scope conflicts and clearly scopes test intent.
**Category**: testing-patterns
**Scope**: globs: ["*.test.tsx", "*.test.ts", "frontend/src/__tests__/**"]
**Novel**: YES — existing rule covers scoping queries to named regions; this covers the file-separation decision that avoids needing to scope in the first place.

### Learning 2: Local dialog state in Draggable child is correct default
**Directive**: Manage dialog/popover open state locally in the component that owns the trigger (Card, not Board) unless the parent needs to programmatically control dialog visibility; lifting dialog state is only warranted when a board-level event must close the dialog.
**Category**: frontend-architecture
**Scope**: globs: ["frontend/src/components/*.tsx"]
**Novel**: YES — existing portal and Escape rules cover rendering and keyboard behavior; no rule currently addresses where dialog open/close state should live in the component hierarchy.

### Learning 3: Enumerate negative scope for destructive-action features
**Directive**: For any permanent-delete or irreversible-action feature, explicitly list out-of-scope items (soft delete, undo, recovery) in the spec's Scope Boundaries section — this is a required spec element, not optional, because it prevents scope creep across both implementation phases.
**Category**: architecture
**Scope**: globs: ["memory-bank/tasks/*.md", "memory-bank/creative/*.md"]
**Novel**: YES — no existing rule covers negative-scope enumeration as a required element for destructive features.
