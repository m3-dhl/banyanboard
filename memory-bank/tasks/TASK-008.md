# TASK-008: Card Labels

**Complexity**: Level 3
**Status**: CREATIVE_COMPLETE
**Roadmap**: FEAT-007
**Branch**: feature/FEAT-007-card-labels
**Worktree**: N/A

## Task Description

Add color-coded labels to cards with filtering support. Includes label data model, backend CRUD + filter endpoints, frontend label badges, color picker, and filter panel. Labels allow team members to categorize cards visually and filter the board to focus on specific workstreams.

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Dev Team Member — a software developer on a small team who needs to categorize cards visually and filter the board to focus on specific workstreams (e.g., "show me only bug fixes" or "show only my work").
**Creative Exploration Needed**: Yes — three design decisions require a `/banyan-creative` phase before implementation:
1. Color picker UX: inline swatch palette on the card vs. a dropdown in a label management modal — needs UI/UX design decision.
2. Label management flow: global label palette (pre-defined colors + names) vs. per-card ad-hoc label creation — needs data model + UX decision.
3. Filter panel placement: above-column toolbar vs. sidebar toggle vs. header bar — needs UI/UX design decision.

### Invocation Method

Three distinct entry points, each needs a design decision (see Creative Exploration Needed):

**Entry Point A — Attach label to a card:**
- **Location**: The card element rendered in `frontend/src/components/Card.tsx` (currently shows only `card.title`)
- **Element**: A label badge area or "Add label" affordance on the card face; exact control TBD in creative phase
- **Visibility**: Visible on every card; no labels attached shows a muted "Add label" hint or is omitted until hover
- **Navigation**: Board visible at `/` → card is visible in its column → click/keyboard activate label control on card
- **Confidence**: MEDIUM — the card component exists and the extension point is clear, but the exact control (button, inline swatch, edit icon) requires the creative phase

**Entry Point B — Label management (create / rename / delete labels):**
- **Location**: TBD — likely a settings area or a modal reachable from the label control; no management UI exists yet
- **Element**: TBD — could be a "Manage labels" link in the label picker, or a board-level settings panel
- **Visibility**: TBD
- **Navigation**: TBD
- **Confidence**: LOW — no existing settings or modal infrastructure in the codebase; requires creative phase decision

**Entry Point C — Filter cards by label:**
- **Location**: Board header area (`frontend/src/components/Board.tsx`, `.board-header` section) or above the column grid (`.board-columns`)
- **Element**: Filter control — exact form (button group, dropdown, chips) TBD in creative phase
- **Visibility**: Always visible when at least one label exists on the board; hidden or greyed out otherwise
- **Navigation**: Board visible → filter control in header/above columns → click label to activate filter
- **Confidence**: MEDIUM — Board.tsx is the right component; exact placement requires creative phase

### Success Criteria

- **User sees (label badge on card)**: One or more colored label badges rendered inside the card element in `frontend/src/components/Card.tsx`, each showing the label color and optionally the label name. Cards without labels show no badge.
- **User sees (label filter active)**: Cards NOT matching the active label filter are hidden from columns; only matching cards are visible. The active filter state is visible in the filter control (highlighted chip, checked state, etc.).
- **Verifiable at**: The board page (`http://localhost:5173`) — label badges visible on cards; filtered view shows reduced card count per column.
- **Data persisted**: PostgreSQL — new `labels` table (id, name, color hex, board_id, created_at) and a `card_labels` join table (card_id, label_id). Persists across page reload.
- **Observable within**: Immediate for optimistic UI updates; confirmed on next page load from DB-backed API responses.

### Acceptance Criteria

#### AC-ENTRY-1: User can see label badges on cards that have labels assigned
**Priority**: MUST
**Given** a card has one or more labels assigned (persisted in the `card_labels` join table)
**When** the user opens the board at `http://localhost:5173`
**Then** each label is rendered as a colored badge inside the card element in `frontend/src/components/Card.tsx`, displaying the label color; cards with no labels show no badge

#### AC-ENTRY-2: User can access the label attachment control on a card
**Priority**: MUST
**Given** the user is viewing the board and can see a card
**When** they click or keyboard-focus the label control on the card (exact control defined in creative phase)
**Then** a label picker UI opens, showing available labels for the board; the control is reachable by keyboard (Tab + Enter/Space)

#### AC-ENTRY-3: User can access the label filter control on the board
**Priority**: MUST
**Given** at least one label exists on the board
**When** the user views the board header or filter area (location defined in creative phase)
**Then** a filter control is visible showing available labels; clicking a label activates/deactivates the filter for that label

#### AC-HAPPY-1: User creates a new label with a name and color
**Priority**: MUST
**Given** the user has opened the label management UI (Entry Point B)
**When** they complete:
  1. Enter a label name (e.g., "Bug")
  2. Select a color from the color picker (e.g., red `#EF4444`)
  3. Confirm / save
**Then** the new label appears in the label picker for all cards on the board; `POST /labels` returns 201 with `{ id, name, color, boardId }`; the label is persisted and visible after page reload

#### AC-HAPPY-2: User attaches a label to a card
**Priority**: MUST
**Given** at least one label exists and the user has opened the label picker on a card
**When** they click a label in the picker
**Then** the label badge appears immediately on the card (optimistic update); `POST /cards/:id/labels` is called and returns 201; the label badge persists after page reload; the activity feed records a "label added" event visible in `frontend/src/components/ActivityFeed.tsx`

#### AC-HAPPY-3: User removes a label from a card
**Priority**: MUST
**Given** a card has at least one label and the label picker is open
**When** the user clicks the active/attached label to toggle it off
**Then** the label badge is removed from the card immediately (optimistic update); `DELETE /cards/:id/labels/:labelId` returns 204; the badge is absent after page reload

#### AC-HAPPY-4: User filters the board to show only cards with a specific label
**Priority**: MUST
**Given** the board shows cards across all columns, some with label "Bug" attached
**When** the user activates the "Bug" label filter in the filter control
**Then** only cards with the "Bug" label are visible in all columns; columns show 0 cards if none match; the active filter is visually indicated in the filter control; non-matching cards are hidden (not deleted)

#### AC-HAPPY-5: User clears the active label filter
**Priority**: MUST
**Given** a label filter is active and the board shows filtered cards
**When** the user clicks the active label again (toggle off) or clicks a "Clear filter" / "All" control
**Then** all cards are visible again across all columns; the filter control returns to its neutral/unfiltered state

#### AC-HAPPY-6: User deletes a label from the board
**Priority**: SHOULD
**Given** a label exists and the user is in label management UI
**When** they delete the label
**Then** `DELETE /labels/:id` returns 204; the label badge is removed from all cards that had it; the label no longer appears in the label picker or filter control; persisted correctly after page reload

#### AC-ERROR-1: Label picker handles API failure gracefully
**Priority**: MUST
**Given** the user has opened the label picker and the backend is unavailable
**When** the API call to fetch labels or attach a label fails
**Then** the card is not changed (no optimistic update left in broken state); a non-blocking error message is shown (consistent with the existing `cardCreateError` pattern in `Board.tsx`); the user can retry

#### AC-ERROR-2: Label creation rejects empty or duplicate name
**Priority**: MUST
**Given** the user is creating a new label
**When** they submit with an empty name or a name that already exists on the board
**Then** the form shows an inline validation error (consistent with `CardForm.tsx` error pattern using `role="alert"`); no API call is made for empty name; `POST /labels` returns 400 with `{ error: "..." }` for duplicate name detected server-side

#### AC-ERROR-3: Filter state is preserved across card drag-and-drop
**Priority**: MUST
**Given** a label filter is active (e.g., "Bug" filter showing only Bug cards)
**When** the user drags a card to a different column
**Then** the drag-and-drop still works (card moves column); the filter remains active; only Bug-labelled cards remain visible in the new column arrangement; non-Bug cards remain hidden

#### AC-ASYNC-1: Card list reload reflects label assignments from other sessions
**Priority**: SHOULD
**Given** another browser session attached a label to a card
**When** the current user refreshes the page
**Then** the card shows the label badge as assigned by the other session; no stale state is visible (page reload fetches fresh data from `GET /cards` which includes label data)

### Scope Boundaries

**In scope:**
- `labels` table: id (UUID), name (VARCHAR 50), color (VARCHAR 7 hex), board_id (UUID FK), created_at
- `card_labels` join table: card_id (UUID FK), label_id (UUID FK), PRIMARY KEY (card_id, label_id)
- Backend endpoints: `POST /labels`, `GET /labels?boardId=:id`, `DELETE /labels/:id`, `POST /cards/:id/labels`, `DELETE /cards/:id/labels/:labelId`, `GET /cards` extended to include labels array
- Frontend: label badge on `Card.tsx`, label picker (dropdown/popover), label management UI, filter control on `Board.tsx`, filter logic in Board state
- `frontend/src/types.ts`: new `Label` interface and updated `CardData` to include `labels: Label[]`
- `frontend/src/api.ts`: new API functions for label CRUD and card-label assignment
- Activity feed: "label added" and "label removed" events in `ActivityFeedEntry` union type
- Backend tests in `backend/src/__tests__/label.test.ts` following the mocked-repository pattern from `card.test.ts`
- Frontend tests in `frontend/src/__tests__/` for label badge rendering, filter behavior

**Out of scope:**
- Label color customization beyond a predefined palette of ~8–12 colors (exact palette defined in creative phase)
- Multi-label filter (AND/OR logic) — first version filters on a single active label
- Label reordering or priority ranking
- Label assignment as part of card creation (`CardForm.tsx`) — labels added post-creation only
- User-specific label visibility or per-user label sets (single board-wide label palette)
- Real-time sync of filter state across browser sessions (WebSockets not in scope per productBrief open questions)
- Board export including label data

**Dependencies:**
- Cards table (`002_create_cards.sql`) must exist — already implemented in TASK-007
- `GET /cards` endpoint does not yet exist (currently only `POST /cards`) — must be added as part of this feature or as a prerequisite; this is a dependency risk
- Board ID is required for label scoping — `boards` table exists from TASK-002; but the frontend does not yet use a real board ID (uses hardcoded name from `GET /boards`)

**NFR implications:**
- Color contrast: label badge colors must meet WCAG 2.1 AA contrast ratio against the card background and against any text on the badge (from productBrief accessibility NFR)
- Performance: label filter must be client-side (no round-trip to backend on filter toggle) to meet p95 < 200ms NFR; label data loaded with card data on initial board fetch
- Keyboard navigation: label picker and filter control must be keyboard accessible (Tab, Enter, Space, Escape) per WCAG 2.1 AA requirement

### Creative Exploration Needed

**Yes** — the following design decisions MUST be resolved in the `/banyan-creative` phase before implementation:

1. **Color picker UI**: Inline swatch palette embedded in the card (hover-reveal) vs. a dropdown/popover triggered by a button vs. a dedicated label management modal. Affects `Card.tsx` complexity and the scope of new component work.

2. **Label management flow**: Are labels defined globally per board (a "label palette" users add to) or are they created ad-hoc from the card picker? Global palette is cleaner for filtering; ad-hoc is lower friction. Affects data model and the need for a separate management UI.

3. **Filter panel placement and interaction model**: A filter bar above the columns (in `.board-header` or between header and `.board-columns`) with label chip toggles is the most discoverable pattern for this codebase. Alternatives: sidebar panel, dropdown in header. Needs a decision so the Board.tsx layout changes are well-defined before Phase 1 build.

## Test Strategy

### Approach
- **Emphasis**: Backend integration tests (supertest, mocked repository) cover label CRUD endpoints and card-label assignment endpoints. Frontend unit tests (Vitest + @testing-library/react) cover label badge rendering, filter logic in Board state, and label picker interactions.
- **Target test count**: ~12–16 backend tests (label.test.ts + card-label.test.ts), ~8–10 frontend tests (LabelBadge, filter behavior, picker toggle)

### File Organization
- `backend/src/__tests__/label.test.ts` — label CRUD endpoint tests (pattern: `card.test.ts`)
- `backend/src/__tests__/card-label.test.ts` — card-label assignment/removal endpoint tests
- `frontend/src/__tests__/Label.test.tsx` — label badge rendering, color display, accessibility
- `frontend/src/__tests__/Board.filter.test.tsx` — filter activation, card hide/show, filter clear

### What NOT to Test
- Color picker library internals (if a 3rd party color swatch component is used)
- @hello-pangea/dnd internals
- CSS layout or visual regression of label colors
- Contrast ratio compliance programmatically (manual WCAG check in UAT phase)
- Docker Compose startup

### Per-Phase Test Guidance
- **Phase 1 (Data model + backend)**: Test all label CRUD endpoints and card-label assignment endpoints with mocked repository; test validation (empty name, invalid color hex, duplicate name, non-existent card/label IDs return 404)
- **Phase 2 (Frontend label badges + picker)**: Test `LabelBadge` component renders color and name; test picker shows available labels; test attach/detach toggles optimistic state correctly; test error state when API fails
- **Phase 3 (Filter panel)**: Test Board state filter logic — activating filter hides non-matching cards; clearing filter restores all cards; drag-and-drop preserves filter state

## Implementation Roadmap

- [x] **Phase 1 — Data model + backend endpoints**: Migration `003_create_labels.sql` (labels table + card_labels join); `label.repository.ts`, `label.service.ts`, `label.controller.ts`, `label.routes.ts`; extend `card.repository.ts` with `GET /cards` including labels; wire routes in `app.ts`; backend tests
- **Phase 2 — Frontend label badges + picker**: Update `frontend/src/types.ts` (Label interface, CardData.labels); new `LabelBadge.tsx` component; new `LabelPicker.tsx` component; update `Card.tsx` to render badges and host picker; update `api.ts` with label API functions; update Board.tsx to fetch labels; frontend tests
- **Phase 3 — Filter panel + activity feed integration**: New filter control component (TBD name from creative phase); update `Board.tsx` filter state logic; update `ActivityFeedEntry` union type for label events; update `ActivityFeed.tsx` to render label events; end-to-end frontend tests for filter behavior

## Creative Phases

- [x] UI/UX Design (color picker UX + label management flow) → `memory-bank/creative/TASK-008-card-labels-uiux.md`
- [x] Architecture Design (label management flow data model decision) → `memory-bank/creative/TASK-008-card-labels-architecture.md`

---

## Execution State

**Build Status**: PHASE_COMPLETE
**Current Build**: Phase 1: Data model + backend endpoints (TASK-008)
**Build Started**: 2026-06-16
**Phase Number**: 1 of 3
**Is Multi-Phase**: YES
**Branch**: feature/FEAT-007-card-labels

### Current Build Step
**Step**: Step 11 - Git Commit
**Status**: COMPLETE
**Completed**: 2026-06-16

### Completed Steps
- Step 0.1: Task created for FEAT-007
- Step 0.2: Phase gate passed
- Step 3: Spec Writer Agent complete (Sonnet) — taxonomy CLEAN
- Step 3.2: Human approved spec [A]
- Step 6: PLANNING_COMPLETE — creative phase required
- Step 1: Context read, agents spawned (2026-06-16)
- UI/UX Design: COMPLETE (2026-06-16) — `memory-bank/creative/TASK-008-card-labels-uiux.md`
- Architecture Design: COMPLETE (2026-06-16) — `memory-bank/creative/TASK-008-card-labels-architecture.md`
- Step 0.5 Git Setup: COMPLETE (2026-06-16) — Branch feature/FEAT-007-card-labels created
- Step 1 Read Task Context: COMPLETE (2026-06-16) — Phase 1 identified (Data model + backend)
- Step 2 Load Context: COMPLETE (2026-06-16) — Level 3 rules, creative docs read

### Sub-Agents
(spawning)

### Resumption Notes
**Can Resume**: YES
**Resume From**: Step 3 - Test Writer
**Notes**: Phase 1 — backend only (migration, label CRUD endpoints, card-label endpoints, GET /cards extended)
