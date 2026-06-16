# TASK-007: Task Creation System

**Complexity**: Level 2 (user-capped; natural eval = Level 3)
**Status**: PLANNING_COMPLETE
**Roadmap**: FEAT-006
**Roadmap Link**: FEAT-006
**Branch**: feature/FEAT-006-task-creation-system
**Worktree**: C:\Users\dominique.haroun_m3i\Documents\workspace\banyanboard (main worktree)

## Task Description

Add ability to create new cards on the kanban board — UI form/modal per column, POST /tasks endpoint, input validation, and integration with the existing activity feed on card creation.

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Team Lead — maintains board structure, creates and organises cards, needs to add new work items quickly without friction; also Dev Team Member who creates cards for their own work items
**Creative Exploration Needed**: No

### Invocation Method

- **Location**: Inside each `Column` component (`frontend/src/components/Column.tsx`), below the `Droppable` card-list area and above the column's closing `</section>` tag
- **Element**: An "Add card" button rendered per column. On click it expands an inline form (title `<input>` + "Add" submit button + "Cancel" link) within that column. The form does not open a modal — it appears inline inside the column, matching the "UI form/modal per column" description in the feature brief and the existing pattern where column-level concerns live in `Column.tsx`.
- **Visibility**: Always visible — the "Add card" button is permanently present at the bottom of every column regardless of how many cards exist in that column
- **Navigation**: User opens app at `http://localhost:5173` → board is visible on first render → user locates target column → clicks "Add card" button at column bottom → types title → clicks "Add" or presses Enter
- **Confidence**: HIGH — `Column.tsx` is the natural host (it already owns the per-column Droppable region and receives `id: ColumnId` as a prop); the "per column" wording in the feature description directly maps to this component

### Success Criteria

- **User sees**: New card appears at the bottom of the target column immediately on submission; the inline form collapses back to the "Add card" button; the Activity Feed appends a new entry reading "[card title] created in [column label]"
- **Verifiable at**: The card is visible in the Droppable card list of the column the user was creating in; the Activity Feed section (already rendered in `Board.tsx`) shows the new entry at the top of the list
- **Data persisted**: For Phase 1 (MVP), card state lives in `Board.tsx`'s `useState<CardData[]>` — same pattern as the existing seed cards. A new `CardData` object `{ id: crypto.randomUUID(), title: trimmedTitle, columnId: targetColumnId }` is prepended or appended to the array. No backend persistence in Phase 1. Phase 2 adds `POST /cards` backend endpoint + DB migration.
- **Observable within**: Immediate (synchronous state update in Phase 1); in Phase 2 the card appears optimistically and the backend call confirms persistence within the p95 < 200ms NFR

### Acceptance Criteria

#### AC-ENTRY-1: "Add card" button is always visible at the bottom of every column
**Priority**: MUST
**Given** the board is rendered with any number of cards (including zero)
**When** a user views any column on the board
**Then** an "Add card" button is visible at the bottom of that column; it is present for all three columns (Todo, In Progress, Done) simultaneously; no column is missing the affordance

#### AC-HAPPY-1: User creates a card in a specific column via the inline form
**Priority**: MUST
**Given** a user is viewing the board and clicks the "Add card" button in any column
**When** they complete:
  1. Click "Add card" button in the target column — the inline form appears (title input + Add button + Cancel)
  2. Type a non-empty card title in the input field
  3. Click "Add" or press Enter
**Then** the new card appears in the card list of that column with the title the user typed; the inline form collapses back to the "Add card" button; the existing `ActivityFeed` component receives a new entry at position 0 of the entries array, with the card title and column; no other column's card list is affected

#### AC-HAPPY-2: User can cancel card creation without creating a card
**Priority**: MUST
**Given** a user has clicked "Add card" and the inline form is open
**When** they click "Cancel" (or press Escape)
**Then** the inline form collapses back to the "Add card" button; no card is added to any column; no activity entry is added to the feed

#### AC-ERROR-1: User cannot submit an empty or whitespace-only title
**Priority**: MUST
**Given** the inline form is open and the title input is empty or contains only whitespace
**When** the user clicks "Add" or presses Enter
**Then** the form does not submit; a visible validation message appears adjacent to the input ("Title is required"); no card is added; no activity entry is added; the input retains focus so the user can correct the title without re-opening the form

#### AC-ERROR-2: Backend unavailability in Phase 2 does not silently lose the card
**Priority**: MUST
**Given** Phase 2 is implemented and the backend `POST /cards` call fails (network error or non-2xx response)
**When** the user submits the card creation form
**Then** the optimistically-added card is removed from the column card list (rollback); a visible error message appears in the column or board level ("Failed to save card — please try again"); the Activity Feed entry is also rolled back; the user can retry without refreshing the page
*Note: AC-ERROR-2 applies only in Phase 2 when backend integration is added. Phase 1 is in-memory only and this scenario does not apply.*

#### AC-ASYNC-1: Activity Feed reflects card creation as a distinct event type
**Priority**: MUST
**Given** a user has successfully created a card in any column
**When** the creation is confirmed (immediately in Phase 1; on backend success in Phase 2)
**Then** the `ActivityFeed` component renders the creation event as the most recent entry; the entry identifies the card title and the target column label (e.g., "Design login page created in Todo"); the entry is announced to screen readers via the existing `role="log"` `aria-live="polite"` region in `frontend/src/components/ActivityFeed.tsx`
*Note: This requires extending `ActivityFeedEntry` in `frontend/src/types.ts` to support a creation event type, or adding a new `action` discriminant field, since the current type only models card-move events (`fromColumn`/`toColumn`).*

### Scope Boundaries

- **In scope**:
  - Per-column "Add card" button always visible at the bottom of each `Column` component
  - Inline form within the column (title input, Add button, Cancel affordance)
  - Client-side title validation: non-empty, trimmed, max 100 characters (matching the board title constraint already in `backend/src/services/board.service.ts`)
  - Extending `ActivityFeedEntry` in `frontend/src/types.ts` to accommodate a card-creation event (new `action` field or union type)
  - Appending a creation event to the Activity Feed on successful card creation
  - Phase 1: in-memory card state (same pattern as `SEED_CARDS` in `Board.tsx`)
  - Phase 2: `POST /cards` backend endpoint following the existing board CRUD pattern (routes → controller → service → repository); DB migration `002_create_cards.sql`; `VITE_API_BASE` used for the fetch call in `frontend/src/api.ts`

- **Out of scope**:
  - Card description, due date, labels, assignee — title only for MVP (productBrief.md target feature set defers these)
  - Editing an existing card (separate feature)
  - Deleting a card (separate feature)
  - Drag-and-drop reordering within the creation flow (cards appear at the end of the list)
  - Card ordering persistence (position is append-only)
  - Multi-board card creation (this feature targets the single active board)
  - Authentication/authorization gates on card creation (no auth in MVP)
  - Keyboard drag-and-drop of the newly created card (DnD library handles existing cards)

- **Dependencies**:
  - FEAT-005 (TASK-006) — Activity Feed component is already implemented and wired into `Board.tsx`; creation events extend the existing `ActivityFeedEntry` type and `feedEntries` state
  - `@hello-pangea/dnd` is already installed — newly created cards will be automatically draggable once added to the `cards` state array
  - Phase 2 only: PostgreSQL `cards` table (new migration); `pool` singleton from `backend/src/db/pool.ts`

- **NFR implications**:
  - Performance: card creation must feel immediate (optimistic update in Phase 2); backend call must meet p95 < 200ms
  - Accessibility: the inline form must be keyboard-navigable; focus must move to the title input when the form opens; "Title is required" error message must be associated with the input via `aria-describedby` or `aria-errormessage`; the Activity Feed ARIA live region already handles screen reader announcement
  - Browser support: Chrome, Firefox, Safari, Edge (latest 2 versions); `crypto.randomUUID()` is available in all target browsers for client-side ID generation in Phase 1

### Creative Exploration Needed

Specification is concrete — proceed to implementation planning.

## Test Strategy

### Approach

- **Emphasis**: Frontend component tests (Vitest + @testing-library/react) for the inline form behaviour, validation, and Activity Feed integration; backend integration tests (Jest + Supertest) for the `POST /cards` endpoint in Phase 2
- **Target test count**: ~8 frontend tests (Column inline form: entry button visible, form opens on click, cancel collapses form, valid submit adds card, empty title blocked, whitespace title blocked, activity entry added, feed entry rolled back on error); ~6 backend tests in Phase 2 (POST 201 with valid title, POST 400 empty title, POST 400 whitespace title, POST 400 title too long, POST 500 on DB error, response body matches Card shape)

### File Organization

- **New test files**:
  - `frontend/src/__tests__/CardForm.test.tsx` — tests for the inline card-creation form component (if extracted as `CardForm.tsx`)
  - `backend/src/__tests__/card.test.ts` — integration tests for `POST /cards` endpoint (Phase 2)
- **Extend existing**:
  - `frontend/src/__tests__/Column.test.tsx` — add tests that assert "Add card" button is present in a rendered Column
  - `frontend/src/__tests__/Board.feed.test.tsx` — add test that card creation appends a creation event to the feed

### What NOT to Test

- `@hello-pangea/dnd` internals — the library makes newly created cards draggable automatically; do not test drag behaviour of newly created cards in this feature's test suite
- CSS layout, visual appearance, or animation of the inline form
- Timestamp formatting precision in Activity Feed entries (locale-dependent, already established as out-of-scope in `systemPatterns.md` Frontend Testing Pattern)
- Docker Compose startup or `tsc --noEmit` (covered by CI)
- Express framework internals for the POST endpoint

### Per-Phase Test Guidance

**Phase 1 (Frontend — inline form + in-memory state):**
- Test that `Column` renders an "Add card" button (role="button", accessible name "Add card") when the component mounts
- Test that clicking "Add card" reveals a title input and an "Add" button; the "Add card" trigger button is no longer visible while the form is open
- Test that clicking "Cancel" collapses the form and restores the "Add card" button; no card is added to the column
- Test that submitting an empty title does not close the form and displays a validation message; verify via `screen.getByText(/title is required/i)` or `getByRole('alert')`
- Test that submitting a valid title calls the `onAddCard` callback (if the form is a child component receiving a callback prop) with the correct `{ title, columnId }`; OR test at `Board.tsx` level that a new card appears in the column after submission
- Follow the learned rule from `testing-patterns.md`: scope all existing Column and Board test queries to named landmark regions (`getByRole('region', { name: /todo/i })`) to prevent false matches against the new form elements

**Phase 2 (Backend — POST /cards endpoint):**
- Use the existing board test as the pattern: `backend/src/__tests__/board.test.ts` uses `supertest(app)` with a mocked repository (`jest.mock('../repositories/board.repository')`)
- Test `POST /cards` returns 201 with a `Card` object `{ id, title, columnId, createdAt }` on valid input
- Test `POST /cards` returns 400 `{ error: "Title is required and cannot be empty" }` when title is absent or blank — matching the exact `ValidationError` message format from `board.service.ts`
- Test `POST /cards` returns 400 when title exceeds 100 characters
- Test `POST /cards` returns 400 when `columnId` is missing or not one of the valid enum values (`todo`, `in-progress`, `done`)
- Test `POST /cards` returns 500 on unexpected repository error
- Follow the learned rule from `architecture.md`: define `ValidationError` in `card.service.ts` and re-export it to `card.controller.ts` — do not duplicate error discrimination logic

## Implementation Roadmap

- [x] Phase 1: Frontend — inline card-creation form in Column; extend ActivityFeedEntry type; wire card creation into Board state and Activity Feed; all new frontend tests passing
- [ ] Phase 2: Backend — DB migration `002_create_cards.sql`; card types (`backend/src/types/card.types.ts`); repository, service, controller, routes for `POST /cards`; register route in `app.ts`; `createCard` API call added to `frontend/src/api.ts`; optimistic update + rollback in `Board.tsx`; all new backend integration tests passing

## Creative Phases

N/A (Level 2)

---

## Execution State

**Build Status**: RUNNING
**Current Phase**: Phase 1 — Frontend inline form + in-memory state
**Phase Number**: 1 of 2
**Is Multi-Phase**: YES
**Build Started**: 2026-06-16

### Current Build Step
**Step**: Phase 1 - COMPLETE
**Status**: COMPLETE
**Started**: 2026-06-16
**Completed**: 2026-06-16

### Active Sub-Agents
(none)

### Completed Steps
- Step 0: TASK-007 created for FEAT-006
- Step 0.2: Phase gate passed
- Step 3: Spec Writer Agent complete — taxonomy CLEAN
- Step 3.2: Human approved specification
- Step 6: Validation gate passed — PLANNING_COMPLETE
- Step 0 Build: New build started — Phase 1
- Step 0.5 Git Setup: COMPLETE (2026-06-16) — feature/FEAT-006-task-creation-system created
- Step 3 Test Writer: COMPLETE (2026-06-16) — 11 CardForm tests, 8 Column tests (4 new), 7 ActivityFeed tests (1 new), 1 Board.feed test (new)
- Step 4 Coding Agent: COMPLETE (2026-06-16) — CardForm.tsx, Column.tsx updated, Board.tsx updated, ActivityFeed.tsx updated, types.ts updated (discriminated union)
- Step 6 Test Execution: COMPLETE (2026-06-16) — 42/42 tests passing
- Step 7 Integration Verification: COMPLETE (2026-06-16) — tests PASS, build PASS, lint PASS
- Phase 1: COMPLETE (2026-06-16)
