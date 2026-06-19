# TASK-017: Card Detail View

**Complexity**: Level 3
**Status**: CREATIVE_COMPLETE
**Roadmap**: FEAT-010
**Branch**: feature/FEAT-010-card-detail-view
**Worktree**: N/A (pending /banyan-build)

## Task Description

Modal o panel lateral que se abre al hacer clic en una card. Muestra y permite editar: título, descripción larga (opcional, Markdown), fecha de vencimiento con badge visual en la card cuando está próxima o vencida, y un hilo de comentarios cronológico. La creación de cards no cambia — descripción, fecha y comentarios solo se añaden desde el detalle. Labels y columna accesibles también desde el detalle. Activity feed registra cambios de descripción, fechas y comentarios nuevos.

## User Journey Definition

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Dev Team Member — a software developer on a small team who needs to see what is in progress, track detail context on a card without leaving the board, and know at a glance which cards are overdue.
**Creative Exploration Needed**: Yes — see Creative Exploration Needed section below.

### Invocation Method

- **Location**: `frontend/src/components/Card.tsx` — the card `<div role="article">` rendered inside each `<Draggable>` in `frontend/src/components/Column.tsx`
- **Element**: A click on the card body (not on the "+ Label" button, not on the "Delete" button, and not on the drag handle — click target is the `<span className="card-title">` area and the card surface excluding the footer action buttons). The card already has `tabIndex={0}` so keyboard Enter/Space will also open the detail.
- **Visibility**: Always visible for every card; no conditional gating. The click handler must be added to the card body in `Card.tsx` without conflicting with `DragHandleProps` (which the entire card div currently receives).
- **Navigation**: Board view (entry point) → click card body → Card Detail Modal opens over the board
- **Confidence**: MEDIUM — the card element exists and has `tabIndex={0}`, but the click-vs-drag separation requires creative exploration (see below). The modal pattern is HIGH confidence (exact pattern established in `DeleteCardDialog.tsx`).

### Success Criteria

- **User sees**: A modal dialog overlaying the board. The modal displays the card title (editable inline), a description area (empty state with placeholder "Add a description…", Markdown rendered when content exists), a due date field, a labels section (current labels + ability to toggle), the current column name (with ability to change column), and a comments thread (chronological, oldest at top). A close button and Escape key dismiss the modal.
- **Verifiable at**: The modal is rendered via `ReactDOM.createPortal` into `document.body` — visible in the DOM as a sibling of the board, not nested inside the Draggable hierarchy. The card on the board shows a due-date badge when `dueDate` is within 3 days of today (yellow) or past (red).
- **Data persisted**: PostgreSQL `cards` table gains `description TEXT` and `due_date TIMESTAMPTZ` columns (new migration). A new `card_comments` table stores comment records (`id UUID`, `card_id UUID FK`, `body TEXT`, `created_at TIMESTAMPTZ`). Changes to title, description, due date, column, and labels are persisted via existing or new API endpoints. Comments are persisted via a new `POST /cards/:id/comments` endpoint.
- **Observable within**: Title/description/due-date edits: immediate optimistic update on the card + confirmed on blur/save. Comments: appear in the thread immediately (optimistic) and persist asynchronously. Due-date badge: re-evaluated on every board render from the card's `dueDate` field.

### Acceptance Criteria

#### AC-ENTRY-1: User can open the Card Detail Modal from any card on the board
**Priority**: MUST
**Given** the user is viewing the kanban board with at least one card visible
**When** the user clicks the card body (title area or card surface, excluding the "+ Label" and "Delete" footer buttons) OR focuses the card with keyboard and presses Enter or Space
**Then** a modal dialog opens, `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the card title heading inside the modal; the board behind is not scrollable while the modal is open; focus moves into the modal and is trapped there (using the existing `useFocusTrap` hook from `frontend/src/hooks/useFocusTrap.ts`)

#### AC-ENTRY-2: Click-vs-drag disambiguation — card click does not fire on drag completion
**Priority**: MUST
**Given** the user drags a card from one column to another (or reorders within a column)
**When** the drag operation completes and the pointer is released
**Then** the Card Detail Modal does NOT open; only an intentional pointer-down + pointer-up without movement (i.e., a genuine click) opens the modal — implement by tracking whether a `dragStart` event fired between `mousedown` and `mouseup` (or use the `onClick` handler only when `snapshot.isDragging` was false throughout the interaction)

#### AC-HAPPY-1: User views and edits the card title from the detail modal
**Priority**: MUST
**Given** the Card Detail Modal is open for a card with an existing title
**When** the user clicks the title area inside the modal (rendered as an inline-editable `<h2>` or a single-line input in display mode), edits the text, and presses Enter or clicks outside the title field
**Then**:
  1. The title updates optimistically in the modal header
  2. `PATCH /cards/:id` is called with `{ title: newTitle }`
  3. The card on the board behind the modal reflects the new title immediately (React state update)
  4. On API failure the title reverts to the previous value and an inline error message appears within the modal

#### AC-HAPPY-2: User adds and views a card description with Markdown rendering
**Priority**: MUST
**Given** the Card Detail Modal is open and the description field is empty
**When** the user clicks the "Add a description…" placeholder, types Markdown content (e.g., `**bold**`, `- list item`), and submits (by clicking a "Save" button or pressing Ctrl+Enter)
**Then**:
  1. The description area switches from edit mode to rendered Markdown view
  2. `PATCH /cards/:id` is called with `{ description: markdownText }`
  3. On subsequent opens of the same card the description renders as formatted HTML (not raw Markdown text)
  4. An "Edit" affordance (pencil icon button or click-to-edit) re-enters edit mode

#### AC-HAPPY-3: User sets a due date and sees a visual badge on the card
**Priority**: MUST
**Given** the Card Detail Modal is open and no due date is set
**When** the user interacts with the due date `<input type="date">` field, selects a date, and the input loses focus (or an explicit Save button is clicked)
**Then**:
  1. `PATCH /cards/:id` is called with `{ dueDate: "YYYY-MM-DD" }`
  2. The modal shows the selected date in a human-readable format (e.g., "Jun 25, 2026")
  3. The card on the board displays a due-date badge below its title; badge is neutral-colored when the date is more than 3 days away, yellow when within 3 days, red when past the due date — evaluated at render time using the client's local date

#### AC-HAPPY-4: User posts a comment and sees it in the chronological thread
**Priority**: MUST
**Given** the Card Detail Modal is open and the comments section is visible (empty state: "No comments yet. Be the first to comment.")
**When** the user types text in the comment input textarea (min 1 character, max 500 characters), clicks "Add comment"
**Then**:
  1. The comment appears at the bottom of the chronological thread immediately (optimistic prepend or append — oldest first ordering)
  2. `POST /cards/:id/comments` is called with `{ body: commentText }`
  3. The comment textarea clears
  4. The activity feed on the board logs a `comment-added` entry: "Comment added to [card title]"
  5. On API failure the optimistic comment is removed from the thread and an inline error message appears

#### AC-HAPPY-5: User changes the card's column from the detail modal
**Priority**: MUST
**Given** the Card Detail Modal is open and the current column is shown (e.g., "In Progress")
**When** the user clicks the column field (rendered as a `<select>` or segmented control) and selects a different column
**Then**:
  1. `PATCH /cards/:id` is called with `{ columnId: newColumnId }`
  2. The card moves to the new column on the board (optimistic update of `cards` state in `Board.tsx`)
  3. An activity feed entry of `kind: 'move'` is appended

#### AC-HAPPY-6: User toggles labels from within the detail modal
**Priority**: MUST
**Given** the Card Detail Modal is open and the labels section shows the board's available labels
**When** the user clicks a label chip to toggle it on or off
**Then** the behavior is identical to toggling via the "+ Label" popover on the card — calls `POST /cards/:id/labels` or `DELETE /cards/:id/labels/:labelId` — and the label badge on the card updates immediately

#### AC-HAPPY-7: User closes the detail modal via Escape, close button, or backdrop click
**Priority**: MUST
**Given** the Card Detail Modal is open
**When** the user presses Escape, clicks the "Close" button (×) in the modal header, or clicks the modal backdrop (`modal-backdrop` div)
**Then** the modal closes; focus returns to the card element that triggered the open (the `useFocusTrap` hook's `triggerRef` restoration handles this); no unsaved inline edits are lost without a warning if the description edit mode was active

#### AC-HAPPY-8: Activity feed logs description changes and due date changes
**Priority**: SHOULD
**Given** the user edits the description or sets/removes a due date from the Card Detail Modal
**When** the change is persisted via `PATCH /cards/:id`
**Then** a new entry appears in the activity feed in `Board.tsx` — `kind: 'description-changed'` for description edits, `kind: 'due-date-changed'` for due date changes — showing the card title and the type of change

#### AC-ERROR-1: API failure on title edit reverts the optimistic update and shows an error
**Priority**: MUST
**Given** the user edits the card title and submits it
**When** `PATCH /cards/:id` returns a non-2xx response
**Then** the title field reverts to its previous value; an inline error message appears within the modal reading "Failed to save title — please try again"; the error is dismissible

#### AC-ERROR-2: API failure on comment post removes the optimistic comment and shows an error
**Priority**: MUST
**Given** the user submits a comment and `POST /cards/:id/comments` returns a non-2xx response
**Then** the optimistically added comment is removed from the thread; an inline error message appears within the comments section; the comment text is NOT lost — it is restored in the textarea so the user can retry

#### AC-ERROR-3: Validation prevents submission of empty or oversized comment
**Priority**: MUST
**Given** the comment textarea is empty (0 characters) or exceeds 500 characters
**When** the user clicks "Add comment"
**Then** the `POST /cards/:id/comments` call is NOT made; an inline validation message appears: "Comment is required" (empty) or "Comment cannot exceed 500 characters" (too long); the "Add comment" button is disabled while the textarea is empty

#### AC-ERROR-4: Card detail opens gracefully when backend is unavailable
**Priority**: SHOULD
**Given** the board is in `apiError` state (backend unavailable, showing local SEED_CARDS data)
**When** the user clicks a card to open the detail
**Then** the modal opens and shows the locally known fields (title, labels); description, due date, and comments sections show a "Unavailable — backend is offline" notice rather than blank fields; no unhandled error is thrown

#### AC-ASYNC-1: Comments posted to a slow backend remain visible until confirmed or rejected
**Priority**: MUST
**Given** the user posts a comment and `POST /cards/:id/comments` is taking more than 500ms
**When** the user views the comments thread while the request is in-flight
**Then** the optimistic comment is visible with a subtle "Saving…" indicator (e.g., reduced opacity or a spinner); the "Add comment" button is disabled while the request is in-flight; on success the indicator clears; on failure the rollback defined in AC-ERROR-2 fires

### Scope Boundaries

- **In scope**:
  - Card Detail Modal component (`CardDetailModal.tsx`) opened by clicking a card body in `frontend/src/components/Card.tsx`
  - Inline editable title (single-line, same 100-char max as card creation)
  - Description field: textarea edit mode + rendered Markdown view mode (a lightweight Markdown renderer; no external rich-text editor)
  - Due date: `<input type="date">` stored as `TIMESTAMPTZ` in the `cards` table; visual badge on the card with three states (none, upcoming ≤3 days, overdue)
  - Comments thread: chronological list (oldest first), new comment form, `card_comments` DB table, `POST /cards/:id/comments` and `GET /cards/:id/comments` endpoints
  - Column change from within the modal (reuses existing move logic in `Board.tsx`)
  - Label toggle from within the modal (reuses existing `onLabelToggle` from `Board.tsx`)
  - Activity feed entries for description changes, due-date changes, and new comments (`ActivityFeedEntry` union type extended in `frontend/src/types.ts`)
  - DB migrations: `ALTER TABLE cards ADD COLUMN description TEXT; ALTER TABLE cards ADD COLUMN due_date TIMESTAMPTZ;` and `CREATE TABLE card_comments`
  - Backend: `GET /cards/:id`, `PATCH /cards/:id` (title, description, dueDate, columnId), `GET /cards/:id/comments`, `POST /cards/:id/comments`
- **Out of scope**:
  - Comment editing or deletion (post-MVP)
  - Comment authorship / user attribution (no auth system in scope for MVP)
  - File attachments on cards (explicitly excluded in productBrief.md open questions)
  - Markdown preview-while-editing (toggle between view and edit mode is sufficient)
  - Real-time comment sync across browser tabs (polling or WebSockets not in MVP scope)
  - Card creation changes — description, due date, and comments are only accessible from the detail view, NOT from the `CardForm` component
  - Mentions, reactions, or other social features
- **Dependencies**:
  - `useFocusTrap` hook (`frontend/src/hooks/useFocusTrap.ts`) — already implemented; reuse directly
  - `ReactDOM.createPortal` modal pattern — established in `DeleteCardDialog.tsx` and `LabelPickerPopover.tsx`
  - `modal-backdrop` CSS class — already defined (used by `DeleteCardDialog` and `LabelManagementPanel`)
  - Backend card endpoints: existing `GET /cards` and `POST /cards`; new `GET /cards/:id`, `PATCH /cards/:id` needed
  - New DB migration files (next in sequence: `005_add_card_description_due_date.sql`, `006_create_card_comments.sql`)
  - A Markdown rendering library — lightweight (e.g., `marked` or `micromark`); to be decided in creative phase
- **NFR implications**:
  - Performance: `GET /cards/:id/comments` must respond in p95 < 200ms for boards with ≤ 500 comments per card (single-team scale per productBrief NFR)
  - Accessibility: Modal must use `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `useFocusTrap`; Escape closes; focus returns to trigger (WCAG 2.1 AA)
  - Due-date badge color contrast: yellow (`#9A7D0A` on white — pre-verified in learned accessibility rules) and red must meet WCAG AA 4.5:1 contrast ratio

### Creative Exploration Needed

Yes — the following design questions must be resolved in a `/banyan-creative` phase before implementation:

1. **Click-vs-drag separation on the card element**: The entire `Card.tsx` div currently receives `dragHandleProps` from `@hello-pangea/dnd`. Clicking to open the detail and dragging to move must be cleanly separated. Two candidate approaches exist: (a) add a dedicated non-draggable "click zone" on the card title that does not receive `dragHandleProps`, or (b) track `isDragging` state across `mousedown`/`mouseup` and suppress `onClick` if a drag occurred. The creative phase must commit to one approach and validate it does not break the existing DnD behavior.

2. **Modal layout and information hierarchy**: The detail modal contains many sections (title, description, due date, labels, column selector, comments). The layout must be decided — a wide single-column panel vs. a two-column layout (metadata left, description + comments right, as in Trello/Linear). Given the team-size target (2–10 people, small boards), a simple single-column layout may suffice, but the creative phase must commit to the layout so the coding agent is not making UX decisions during build.

3. **Markdown renderer library choice**: `marked`, `micromark`, and `remark` are candidates. The creative phase must evaluate bundle size, XSS safety (the renderer must sanitize output since comment and description content is user-supplied), and ease of integration with the existing Vite/React stack. A decision must be recorded in the creative doc.

4. **Description edit UX — single Save button vs. auto-save on blur**: The creative phase must decide whether description edits are committed with an explicit "Save" button (safer, less surprising) or auto-saved on blur (smoother). The choice affects optimistic update rollback complexity.

---

## Test Strategy

### Approach

Testing follows the established BanyanBoard pattern: backend integration tests via Jest + Supertest against the `app.ts` factory; frontend component tests via Vitest + @testing-library/react with `jsdom`.

- **Target test count**: 30–40 new tests across backend and frontend
- Backend: test the four new/modified endpoints (`GET /cards/:id`, `PATCH /cards/:id`, `GET /cards/:id/comments`, `POST /cards/:id/comments`) with mocked repository layer — follow the pattern in `backend/src/__tests__/card.test.ts`
- Frontend: `CardDetailModal.detail.test.tsx` for the modal itself (open/close, field display, edit/save, error states); `Card.click.test.tsx` for the click-vs-drag disambiguation; `Card.duebadge.test.tsx` for the due-date badge rendering logic
- All new `ActivityFeedEntry` kinds (`description-changed`, `due-date-changed`, `comment-added`) must be covered in `Board.feed.test.tsx` or a new `Board.detail.test.tsx`
- Do NOT extend the existing `Card.delete.test.tsx` — create new concern-scoped files per the learned testing pattern

### File Organization

```
backend/src/__tests__/
  card.detail.test.ts          # GET /cards/:id, PATCH /cards/:id
  comment.test.ts              # GET /cards/:id/comments, POST /cards/:id/comments

frontend/src/__tests__/
  CardDetailModal.detail.test.tsx   # Modal open/close, title edit, description edit, due date, label toggle, column change
  CardDetailModal.comments.test.tsx # Comment thread, optimistic add, rollback, validation
  Card.click.test.tsx               # Click-vs-drag disambiguation
  Card.duebadge.test.tsx            # Due-date badge: none / upcoming / overdue states
  Board.detail.test.tsx             # Activity feed integration for new event kinds
```

### What NOT to Test

- Markdown rendering accuracy — that is the library's responsibility; test only that the rendered output is non-empty when description is non-empty
- CSS layout or visual appearance of the modal
- @hello-pangea/dnd internals (drag physics)
- Date locale formatting precision — assert the presence of the date badge, not its exact locale string
- Postgres migration scripts directly — the migration is verified by the integration test setup creating the schema

### Per-Phase Test Guidance

**Phase 1 — Backend (DB schema + new endpoints):**
- Write tests for `GET /cards/:id` — 200 with full card (title, description, dueDate, labels), 404 for unknown ID, 400 for invalid UUID
- Write tests for `PATCH /cards/:id` — updates title only, description only, dueDate only, columnId only, combined; 400 for empty title; 404 for unknown card; verify column-change triggers the same column constraint as card creation
- Write tests for `POST /cards/:id/comments` — 201 with comment body, 400 for empty body, 400 for body > 500 chars, 404 for unknown card
- Write tests for `GET /cards/:id/comments` — empty array when no comments, ordered array (oldest first) when comments exist
- All backend tests use mocked repositories (follow `board.test.ts` pattern)

**Phase 2 — Frontend Modal + Card click:**
- Test `CardDetailModal` renders: title, empty description placeholder, empty comments state, close button
- Test title edit: user types new title, submits, `PATCH /cards/:id` called with correct body, card title updates
- Test title edit rollback: mock `PATCH` to reject, assert title reverts and error message appears
- Test due-date badge on `Card`: inject `dueDate` prop — assert no badge when null, assert badge class `card-badge--upcoming` when 2 days ahead, assert `card-badge--overdue` when yesterday
- Test click-vs-drag: simulate a genuine click (not preceded by drag event) → modal opens; simulate a `dragStart` → modal does NOT open on the subsequent `mouseup`

**Phase 3 — Comments + Activity Feed integration:**
- Test comment submit: textarea fills, "Add comment" clicked, optimistic comment appears, `POST` called, textarea clears
- Test comment rollback: mock `POST` to reject, optimistic comment removed, textarea text restored
- Test comment validation: empty textarea → submit button disabled; 501-char string → error message
- Test new activity feed entries: `description-changed` and `comment-added` entries appear in the feed after the respective board-level state updates

---

## Implementation Roadmap

### ✅ Phase 1 — Backend: Schema + Card Detail Endpoints (2 migrations, 4 endpoints)
- Migration `005_add_card_description_due_date.sql`: `ALTER TABLE cards ADD COLUMN description TEXT; ALTER TABLE cards ADD COLUMN due_date TIMESTAMPTZ;`
- Migration `006_create_card_comments.sql`: `CREATE TABLE card_comments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE, body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`
- Update `card.types.ts`: add `description?: string | null; dueDate?: Date | null` to `Card`; add `UpdateCardDto`; add `CreateCommentDto` and `Comment` types in new `comment.types.ts`
- Update `card.repository.ts`: add `getCardById(id)`, update `CARD_WITH_LABELS_QUERY` to include `description` and `due_date`; add `updateCard(id, dto)` (partial update with explicit field list)
- New `comment.repository.ts`: `getCommentsByCardId(cardId)`, `createComment(cardId, body)`
- New `comment.service.ts` with validation
- Update `card.controller.ts`: add `getCardById`, `updateCard` handlers; new `comment.controller.ts` with `getComments`, `createComment`
- Update `card.routes.ts`: add `GET /:id`, `PATCH /:id`; add `GET /:id/comments`, `POST /:id/comments`
- Commit: backend phase complete

### ✅ Phase 2 — Frontend: CardDetailModal Component + Card Click Handler
- Resolve creative decisions (click-vs-drag approach, modal layout, Markdown library)
- Install chosen Markdown library (e.g., `marked`) in `frontend/package.json`
- Add `description?: string; dueDate?: string | null` to `CardData` in `frontend/src/types.ts`
- Extend `ActivityFeedEntry` union with `description-changed`, `due-date-changed`, `comment-added` kinds
- Add `getCard(id)`, `updateCard(id, dto)`, `getComments(cardId)`, `createComment(cardId, body)` to `frontend/src/api.ts`
- Create `frontend/src/components/CardDetailModal.tsx` — portal-based modal following `DeleteCardDialog.tsx` pattern; sections: title editor, description editor, due-date input, labels section (reuse `LabelPickerPopover`-style logic), column selector, comments thread
- Modify `frontend/src/components/Card.tsx`: add click handler to card body (excluding footer buttons); pass `onOpenDetail: (cardId: string) => void` prop; add due-date badge rendering based on `card.dueDate`
- Modify `frontend/src/components/Board.tsx`: manage `openDetailCardId: string | null` state; handle all detail modal callbacks (`onTitleChange`, `onDescriptionChange`, `onDueDateChange`, `onCommentAdd`); pass through to `CardDetailModal`; extend `feedEntries` for new event kinds
- Commit: frontend modal phase complete

### Phase 3 — Integration + Polish + E2E Tests
- End-to-end test pass: open modal, edit title, set due date, add comment, change column — verify all changes persist across page refresh (real API calls against test DB)
- Markdown XSS sanitization verification: inject `<script>alert(1)</script>` as description, assert it does not execute (the Markdown library must HTML-encode or strip script tags)
- Keyboard navigation audit: Tab through all modal fields, Escape closes, focus returns to originating card
- Due-date badge edge cases: cards created before `005` migration run (null due_date) must render without a badge and without a JS error
- Update `frontend/src/types.ts` `SEED_CARDS` to omit `dueDate` and `description` (they are already optional, no change needed — verify)
- Commit: integration + polish complete

---

## Creative Phases

- [x] UI/UX Design — Card Detail Modal Layout and Click Interaction Design → `memory-bank/creative/TASK-017-card-detail-uiux.md`
- [x] Architecture Design — Markdown Library Selection and State Management → `memory-bank/creative/TASK-017-card-detail-architecture.md`

---

## Execution State

**Build Status**: PHASE_COMPLETE
**Current Build**: Phase 3 — Integration + Polish + E2E Tests (TASK-017)
**Build Started**: 2026-06-19
**Phase Number**: 2 of 3 complete
**Is Multi-Phase**: YES

### Current Build Step
**Step**: Awaiting Phase 3
**Status**: PENDING

### Completed Steps
- Spec Writer Agent: COMPLETE — specification written to TASK-017.md
- UI/UX Creative: COMPLETE — memory-bank/creative/TASK-017-card-detail-uiux.md
- Architecture Creative: COMPLETE — memory-bank/creative/TASK-017-card-detail-architecture.md
- Step 0.5 Git Setup: COMPLETE (2026-06-19) — branch feature/FEAT-010-card-detail-view created
- Step 1 Read Task Context: COMPLETE (2026-06-19) — Phase 1 identified
- Step 2 Load Context: COMPLETE (2026-06-19) — Level 3 rules loaded
- Step 3 Test Writer: COMPLETE (2026-06-19) — 40 tests in 2 files (card.detail.test.ts, comment.test.ts)
- Step 4 Coding Agent: COMPLETE (2026-06-19) — all Phase 1 files implemented
- Step 5-7 Test+Build+Verify: COMPLETE (2026-06-19) — 112/112 tests pass, TSC clean
- Step 11 Git Commit: COMPLETE (2026-06-19) — Phase 1 committed to feature/FEAT-010-card-detail-view
- Phase 2 Test Writer: COMPLETE (2026-06-19) — frontend tests for modal, click handler, due-date badge
- Phase 2 Coding Agent: COMPLETE (2026-06-19) — CardDetailModal.tsx, Card.tsx (pointer-delta + badge), Board.tsx wiring
- Phase 2 Test+Build+Verify: COMPLETE (2026-06-19) — all tests pass, TSC clean
- Phase 2 Git Commit: COMPLETE (2026-06-19) — Phase 2 committed to feature/FEAT-010-card-detail-view

### Sub-Agents
(none active)

### Resumption Notes
**Can Resume**: YES
**Resume From**: Phase 2 — Frontend modal + card click handler
**Notes**: Phase 1 complete. Phase 2 = install react-markdown, update types.ts + api.ts, create CardDetailModal + DescriptionSection + CommentsSection, modify Card.tsx (pointer-delta + due-date badge), wire Board.tsx
