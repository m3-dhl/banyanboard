# Archive: Card Labels

## Metadata
- **Task ID**: TASK-008
- **Complexity**: Level 3
- **Started**: 2026-06-16
- **Completed**: 2026-06-16
- **Roadmap Link**: FEAT-007
- **Branch**: feature/FEAT-007-card-labels

## Summary

TASK-008 delivered a full color-coded card labeling system for BanyanBoard. Team members can now create labels with names and colors (10-color WCAG AA palette), attach/detach labels from cards, filter the board to show only cards with a specific label, and delete labels. All UI interactions are keyboard accessible, and the activity feed records label-added and label-removed events. The feature covers the full stack: PostgreSQL two-table data model (`labels` + `card_labels`), five REST endpoints, and four new React components plus one hook.

## Requirements

### Acceptance Criteria Coverage

| AC | Status |
|----|--------|
| AC-ENTRY-1: Label badges visible on cards with labels | Delivered |
| AC-ENTRY-2: Label picker keyboard accessible (Tab, Enter, Space, Escape) | Delivered |
| AC-ENTRY-3: Filter control visible when labels exist | Delivered |
| AC-HAPPY-1: Create label with name + color | Delivered |
| AC-HAPPY-2: Attach label, optimistic update, activity feed | Delivered |
| AC-HAPPY-3: Remove label from card | Delivered |
| AC-HAPPY-4: Filter board by label (client-side) | Delivered |
| AC-HAPPY-5: Clear active label filter | Delivered |
| AC-HAPPY-6: Delete label from board | Delivered |
| AC-ERROR-1: API failure graceful handling with rollback | Delivered |
| AC-ERROR-2: Empty / duplicate name rejected | Delivered |
| AC-ERROR-3: Filter state preserved across drag-and-drop | Delivered |
| AC-ASYNC-1: Page reload reflects other session's label assignments | Delivered |

All 13 criteria (12 MUST + 1 SHOULD) met. No scope creep.

## Implementation

### Approach

Three-phase build matching the natural dependency order: backend data model and endpoints first, then the full frontend layer, then activity feed integration. The creative phase resolved three key design questions before any code was written — preventing mid-build rework.

### Phase 1 — Data Model + Backend Endpoints

**Migration**: `backend/src/db/migrations/003_create_labels.sql`
- `labels` table: UUID PK, name VARCHAR(50), color VARCHAR(7) hex, board_id FK with CASCADE, UNIQUE(name, board_id), index on board_id
- `card_labels` join table: card_id + label_id composite PK, CASCADE deletes, index on label_id

**New files**:
- `backend/src/types/label.types.ts` — `Label`, `LabelSummary`, `CreateLabelDto`
- `backend/src/errors/index.ts` — shared `ValidationError`, `NotFoundError`, `ConflictError`
- `backend/src/repositories/label.repository.ts` — 6 repository functions
- `backend/src/services/label.service.ts` — validation (hex regex, name length, duplicate check)
- `backend/src/controllers/label.controller.ts` — dual instanceof/name error guards
- `backend/src/routes/label.routes.ts` — `POST /labels`, `GET /labels`, `DELETE /labels/:id`

**Modified**:
- `backend/src/types/card.types.ts` — added `labels?: LabelSummary[]` to `Card`
- `backend/src/repositories/card.repository.ts` — `getCards()` with LEFT JOIN + `json_agg`
- `backend/src/services/card.service.ts` — added `getCards()`, shared ValidationError
- `backend/src/controllers/card.controller.ts` — added `getCards` handler
- `backend/src/routes/card.routes.ts` — added `GET /cards`, `POST /cards/:id/labels`, `DELETE /cards/:id/labels/:labelId`
- `backend/src/app.ts` — mounted `labelRouter` at `/labels`

**Tests**: 21 new in `backend/src/__tests__/label.test.ts` (label CRUD + card-label endpoints + GET /cards with labels)

### Phase 2 — Frontend Label Badges + Picker

**New files**:
- `frontend/src/hooks/useFocusTrap.ts` — minimal focus trap hook (~30 lines)
- `frontend/src/components/LabelBadge.tsx` — colored pill badge
- `frontend/src/components/LabelPickerPopover.tsx` — portal-rendered popover (see Design Decisions)
- `frontend/src/components/LabelManagementPanel.tsx` — create/delete label dialog
- `frontend/src/components/FilterBar.tsx` — horizontal chip filter strip

**Modified**:
- `frontend/src/types.ts` — `Label` interface, `LABEL_COLORS` constant (10 WCAG AA colors), `CardData.labels?: Label[]`
- `frontend/src/api.ts` — `fetchCards`, `fetchLabels`, `createLabel`, `deleteLabel`, `attachLabel`, `detachLabel`
- `frontend/src/components/Card.tsx` — label badge list + `[+ Label]` button + LabelPickerPopover
- `frontend/src/components/Column.tsx` — passes `labels` and `onLabelToggle` through
- `frontend/src/components/Board.tsx` — label/filter state, optimistic attach/detach, FilterBar + LabelManagementPanel
- `frontend/src/App.css` — CSS for all new label components

**Fixed**: `frontend/src/__tests__/ActivityFeed.test.tsx` — pre-existing failure (check `datetime` attribute, not `textContent`, for formatted time display)

**Tests**: 26 new in `frontend/src/__tests__/Label.test.tsx` and `frontend/src/__tests__/Board.filter.test.tsx`

### Phase 3 — Activity Feed Integration

**Modified**:
- `frontend/src/types.ts` — `ActivityFeedEntry` union extended with `label-added` and `label-removed` variants
- `frontend/src/components/Board.tsx` — `onLabelToggle` emits feed entries with optimistic revert on failure
- `frontend/src/components/ActivityFeed.tsx` — renders label-added and label-removed events with label name

**Tests**: 3 new in `frontend/src/__tests__/Board.feed.test.tsx` (label-added, label-removed, AC-ERROR-3 drag-preserves-filter)

### Design Decisions

Resolved in creative phase. Reference: `memory-bank/creative/TASK-008-card-labels-uiux.md` and `memory-bank/creative/TASK-008-card-labels-architecture.md`

1. **Picker UX (Option 3 selected)**: Popover triggered by `[+ Label]` button on card + separate LabelManagementPanel dialog. Hover-reveal (Option 1) was eliminated by WCAG 2.1 SC 1.4.13 — content that appears on hover must also be dismissable, persistent, and hoverable; failing to meet this would block AA compliance.

2. **Label management (Option A selected)**: Global board palette (two-table model). Labels are board-scoped entities with stable UUIDs. Ad-hoc per-card creation was eliminated because the required API shape specified label entities needed stable IDs for assignment and filtering.

3. **Filter placement**: FilterBar rendered between board header and column grid (`Board.tsx`). Horizontal chip toggles — one click activates, second click deactivates. "All" chip restores full view.

4. **Portal popover**: `LabelPickerPopover` uses `ReactDOM.createPortal` into `document.body`. The `@hello-pangea/dnd` Draggable wrapper applies a CSS `transform` that creates a new stacking context, clipping `position: absolute` descendants. Portaling to `document.body` and using `position: fixed` + `getBoundingClientRect` escapes this.

5. **Escape key scope**: Escape listener attached to the popover container element (not `document`) — prevents intercepting the dnd library's own keyboard drag-cancel handler.

## Testing

| Phase | New Tests | Cumulative Total |
|-------|-----------|-----------------|
| Phase 1 (backend) | 21 | 58 |
| Phase 2 (frontend) | 26 | 71 |
| Phase 3 (feed integration) | 3 | 74 |

- All 74 tests pass
- Backend tests: label CRUD endpoints, card-label assignment/removal, GET /cards with labels, validation and conflict cases
- Frontend tests: badge rendering, filter activation/deactivation, picker toggle, optimistic rollback, keyboard simulation, feed entry types
- Code review: 4 blocking issues found and fixed in Phase 2 before commit

## Files Changed

**Backend (new)**:
- `backend/src/db/migrations/003_create_labels.sql`
- `backend/src/types/label.types.ts`
- `backend/src/errors/index.ts`
- `backend/src/repositories/label.repository.ts`
- `backend/src/services/label.service.ts`
- `backend/src/controllers/label.controller.ts`
- `backend/src/routes/label.routes.ts`
- `backend/src/__tests__/label.test.ts`

**Backend (modified)**:
- `backend/src/types/card.types.ts`
- `backend/src/repositories/card.repository.ts`
- `backend/src/services/card.service.ts`
- `backend/src/controllers/card.controller.ts`
- `backend/src/routes/card.routes.ts`
- `backend/src/app.ts`

**Frontend (new)**:
- `frontend/src/hooks/useFocusTrap.ts`
- `frontend/src/components/LabelBadge.tsx`
- `frontend/src/components/LabelPickerPopover.tsx`
- `frontend/src/components/LabelManagementPanel.tsx`
- `frontend/src/components/FilterBar.tsx`
- `frontend/src/__tests__/Label.test.tsx`
- `frontend/src/__tests__/Board.filter.test.tsx`

**Frontend (modified)**:
- `frontend/src/types.ts`
- `frontend/src/api.ts`
- `frontend/src/components/Card.tsx`
- `frontend/src/components/Column.tsx`
- `frontend/src/components/Board.tsx`
- `frontend/src/components/ActivityFeed.tsx`
- `frontend/src/App.css`
- `frontend/src/__tests__/ActivityFeed.test.tsx` (fix)

## Lessons Learned

Key takeaways from the reflection:

1. **Creative phase accessibility analysis pays off**: WCAG 2.1 SC 1.4.13 analysis eliminated hover-reveal before implementation — saving rework that would have been caught in UAT.

2. **Pre-verified color palette in creative doc**: Having 10 colors with verified contrast ratios in the architecture decision document meant the coding agent copied a vetted constant instead of computing ratios during build.

3. **Exact DDL in architecture doc**: Providing `CREATE TABLE` SQL in the creative doc meant the migration was written correctly on the first attempt.

4. **Test-first Phase 2**: Test writer ran before coding agent, forcing component API (props, aria attributes, event handler signatures) to be defined explicitly before implementation.

5. **Portal-to-body for dnd-adjacent popovers**: Any floating UI inside a `@hello-pangea/dnd` Draggable must use `ReactDOM.createPortal` — the CSS transform stacking context clips `position: absolute` children.

6. **Dual instanceof/name guard**: Express controllers need both `instanceof ErrorClass` and `.name === 'ErrorClass'` checks — Jest module isolation can break the prototype chain across test boundaries.

Reference: `memory-bank/reflection/reflection-TASK-008.md`

## Technical Debt

- **No board_id on cards table**: Label filter joins through `labels.board_id`. Works correctly but adds a join hop. If cards need independent board-scoped queries, a migration will be needed.
- **Mobile responsive CSS not UAT-tested**: Responsive breakpoints in App.css are speculative. Needs verification when mobile support is prioritized.
- **OTEL / structured logging deferred**: Same state as all prior tasks. Full OpenTelemetry pipeline aspirational; current observability is correlation IDs via `X-Request-ID`.

## References
- Reflection: `memory-bank/reflection/reflection-TASK-008.md`
- Creative (UI/UX): `memory-bank/creative/TASK-008-card-labels-uiux.md`
- Creative (Architecture): `memory-bank/creative/TASK-008-card-labels-architecture.md`

## Follow-up

- Run `/banyan-uat TASK-008` when Claude-in-Chrome is available to verify mobile responsive behavior and WCAG AA contrast in the browser
- Add `board_id` to the `cards` table as a separate feature when board-scoped card queries are needed
- Full OpenTelemetry pipeline is deferred — track as a separate infrastructure task
