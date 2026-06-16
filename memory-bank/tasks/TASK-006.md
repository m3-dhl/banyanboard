# TASK-006: Realtime Activity Feed

**Complexity**: Level 2 (user-capped; natural eval = Level 3)
**Max Phases**: 2 (user-enforced)
**Status**: PLANNING_COMPLETE
**Roadmap**: FEAT-005
**Branch**: feature/FEAT-005-realtime-activity-feed
**Worktree**: N/A

## Task Description

Track and display a realtime activity feed of card movements between columns. Scoped to ≤2 implementation phases per user constraint.

Feature context (FEAT-005):
- Track every drag-and-drop card movement event
- Display a feed/log of recent movements visible in the UI
- "Realtime" in this MVP context = updates immediately on the same client when a card is moved (no multi-user sync required unless feasible within scope)

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Dev Team Member — software developer who needs to see what's in progress, move their own cards, and know what's blocked. Also serves Team Lead who needs full board visibility at a glance and wants to audit recent card movements.
**Creative Exploration Needed**: Yes — feed placement (below columns vs. right sidebar) requires a layout decision. See Creative Exploration Needed section.

### Invocation Method

- **Location**: `frontend/src/components/Board.tsx` — the `<main className="board-container">` element currently has two children: `board-header` and `board-columns`. The activity feed renders as a new `<section className="activity-feed">` added after `board-columns` in that same `<main>`. It is always present on the board view; no navigation is required to find it.
- **Element**: A new `ActivityFeed` component (`frontend/src/components/ActivityFeed.tsx`) rendered directly inside `Board.tsx`. The feed is a read-only scrollable list — no button or trigger required to open it; it is always visible when the board is visible.
- **Visibility**: Always visible — no toggle, no menu, no separate route. Feed is rendered unconditionally as part of the board layout. When empty (no moves yet), it shows the empty state text "No activity yet."
- **Navigation**: Open `http://localhost:5173` → board renders → feed is visible at the bottom of the page (or as a right panel if layout decision goes that way — see Creative Exploration Needed). Zero additional navigation steps.
- **Confidence**: MEDIUM — entry point and component location are HIGH confidence (Board.tsx is the only parent); feed placement within the layout is LOW confidence (below vs. sidebar requires a UX layout decision not yet made; see Creative Exploration Needed).

### Success Criteria

- **User sees**: A labeled section titled "Activity" (or "Recent Activity") containing a list of entries in reverse-chronological order. Each entry reads: `"[Card title]" moved from [Source Column] → [Target Column]` with a relative or absolute timestamp. The most recent move appears at the top.
- **Verifiable at**: `http://localhost:5173` — drag a card, observe the feed entry appear immediately below the board columns (or in the right panel) without page reload.
- **Data persisted**: In-memory only. Feed entries are stored in React `useState` inside `Board.tsx` (or a co-located custom hook `useActivityFeed`). No backend API call, no `localStorage`, no Postgres persistence. Feed resets on page reload.
- **Observable within**: Immediate (synchronous) — feed entry appears in the same React render cycle triggered by the `onDragEnd` callback. No polling, no debounce, no async gap. Perceived latency is indistinguishable from the card move itself (< 100ms per productBrief DnD NFR).

### Acceptance Criteria

#### AC-ENTRY-1: Activity feed section is visible on the board without any extra navigation
**Priority**: MUST
**Given** the user opens `http://localhost:5173` and the board renders
**When** they view the page without performing any action
**Then** a section labeled "Activity" (or "Recent Activity") is visible on the page; it displays the text "No activity yet." (or equivalent empty-state copy); no button, toggle, or extra navigation is required to reveal it

#### AC-HAPPY-1: Feed records a card move immediately when a card is dragged to a different column
**Priority**: MUST
**Given** the board is rendered with at least one card in a column (e.g., "Design login page" in Todo) and the `onDragEnd` callback in `Board.tsx` has been wired to update feed state
**When** the user drags that card and drops it onto a different column (e.g., In Progress)
**Then**
  1. A new entry appears at the top of the Activity feed immediately (same render cycle, no reload)
  2. The entry text reads: `"Design login page" moved from Todo → In Progress`
  3. The entry includes a timestamp (ISO string, locale-formatted string, or relative label such as "just now")
  4. The card's new position in the column is correct simultaneously

#### AC-HAPPY-2: Feed accumulates entries in reverse-chronological order across multiple moves
**Priority**: MUST
**Given** the user has already performed at least one card move (one entry exists in the feed)
**When** they drag a second card to another column
**Then**
  1. A second entry is prepended at the top of the feed list
  2. The first entry is now second in the list
  3. The feed shows the two most recent moves in newest-first order
  4. All previous entries remain visible (no entries are dropped until the cap is reached — see AC-HAPPY-3)

#### AC-HAPPY-3: Feed caps at 20 entries and discards the oldest when the cap is exceeded
**Priority**: MUST
**Given** the feed already contains 20 entries
**When** the user performs one more card move (the 21st event)
**Then**
  1. The new entry appears at the top of the feed
  2. The oldest (bottom) entry is removed
  3. The feed never displays more than 20 entries at any time

#### AC-HAPPY-4: Dropping a card back onto its own column does not add a feed entry
**Priority**: MUST
**Given** the user begins dragging a card
**When** they drop it back onto the same column it came from (source column === destination column)
**Then** no new entry is added to the feed; the feed list is unchanged; the card position is unchanged

#### AC-ERROR-1: Feed remains visible and functional when the backend API is unreachable
**Priority**: MUST
**Given** the backend at `http://localhost:3001` is not running (Board.tsx already handles this via `apiError` state)
**When** the board loads in offline/API-error state and the user performs a card drag
**Then**
  1. The activity feed renders normally (the "No activity yet." empty state appears on load)
  2. Card moves still produce feed entries identically to the online case
  3. No JavaScript error is thrown related to the feed component
  4. The existing `"Backend unavailable — showing local data"` notice (from `Board.tsx` `apiError` branch) is not replaced or hidden by the feed

#### AC-ERROR-2: Feed renders gracefully when no cards exist on the board
**Priority**: SHOULD
**Given** the board is rendered with zero cards (all cards have been moved and the seed data is absent or empty)
**When** the user views the activity feed section
**Then** the feed shows the "No activity yet." empty state without throwing a JavaScript error or rendering broken markup

#### AC-ASYNC-1: Feed state survives React re-renders triggered by unrelated board updates
**Priority**: MUST
**Given** the feed contains one or more entries
**When** a React re-render occurs for a reason unrelated to a card move (e.g., the `boardName` state updates after `GET /boards` resolves)
**Then** all existing feed entries are still present and in the same order; no entries are lost or duplicated

#### AC-INTEGRATION-1: Feed entries are derived from the actual onDragEnd result, not from a hardcoded stub
**Priority**: MUST
**Given** the `onDragEnd` handler in `Board.tsx` fires with a real `DropResult` from `@hello-pangea/dnd`
**When** a card is dragged from column A to column B
**Then**
  1. The feed entry's "from" label matches the `source.droppableId` resolved to a column label (e.g., `'todo'` → `'Todo'`)
  2. The feed entry's "to" label matches the `destination.droppableId` resolved to a column label
  3. The card title in the feed entry matches the `draggableId` resolved to the card's actual `title` field from the cards state array — not a hardcoded string

### Scope Boundaries

- **In scope**:
  - New `ActivityFeedEntry` type added to `frontend/src/types.ts` with fields: `id` (string), `cardTitle` (string), `fromColumn` (ColumnId), `toColumn` (ColumnId), `timestamp` (Date or ISO string)
  - New `ActivityFeed` component at `frontend/src/components/ActivityFeed.tsx` — renders the scrollable list and empty state
  - Feed state (`ActivityFeedEntry[]`) held in `Board.tsx` via `useState`, initialized as empty array
  - `onDragEnd` callback in `Board.tsx` (Phase 2 of TASK-005) extended to append a feed entry when source !== destination column
  - Feed capped at 20 entries (oldest entry removed when cap exceeded)
  - Reverse-chronological display (newest entry at top)
  - Each entry shows: card title, source column label, destination column label, timestamp
  - Empty state: "No activity yet." text when feed is empty
  - In-memory only — resets on page reload

- **Out of scope**:
  - Backend persistence of activity entries (no new API endpoint, no Postgres table)
  - Multi-user sync / WebSockets / SSE — "realtime" means same-client immediate update only
  - `localStorage` persistence across page reloads
  - Filtering or searching feed entries
  - Clicking a feed entry to navigate to the card
  - User identity on feed entries (no "moved by [user]" — auth not in scope)
  - Feed entries for card creation or deletion (card CRUD not in scope for TASK-005/TASK-006)
  - Animations or transitions on feed entry appearance
  - Feed export or copy-to-clipboard

- **Dependencies**:
  - TASK-005 Phase 2 (DnD integration) MUST be complete before TASK-006 Phase 2. The `onDragEnd` handler in `Board.tsx` is the insertion point for feed entry creation. Phase 1 of TASK-006 (ActivityFeed component + types) can be built independently.
  - `@hello-pangea/dnd` installed in `frontend/` (delivered by TASK-005 Phase 2)
  - `frontend/src/types.ts` — will be extended with `ActivityFeedEntry`

- **NFR implications** (from productBrief):
  - Feed entry creation is synchronous in the `onDragEnd` handler — zero async cost, no API call
  - The 20-entry cap bounds memory growth; no unbounded array growth
  - WCAG 2.1 AA: feed section must have a heading or `aria-label`; entries must be readable by keyboard/screen reader (`role="log"` or `role="list"` appropriate)
  - Color contrast for timestamp text must meet AA ratio

### Creative Exploration Needed

**Layout placement** — LOW confidence. Two viable options exist; a UX decision is needed before Phase 1 implementation:

Option A (default, lower risk): Feed renders as a `<section className="activity-feed">` **below** `board-columns` inside the existing `<main className="board-container">` in `Board.tsx`. No structural layout changes required. Feed is full-width beneath the 3 columns. Works with the current CSS without modifying `board-columns` styles.

Option B (sidebar, higher visual value): A right-side panel alongside `board-columns`. Would require wrapping `board-columns` + feed in a new horizontal flex container inside `Board.tsx`. Requires CSS changes and a new wrapper `<div>`. Columns would need to share horizontal space with the feed panel (e.g., feed takes ~250px, columns take remaining width).

This spec defaults to Option A. If the user prefers Option B, the implementation plan should note the CSS wrapper change. No functional AC changes are needed — only the layout differs.

## Test Strategy

### Approach
- **Emphasis**: Unit tests for ActivityFeed component rendering + integration tests for onDragEnd feed-state logic in Board
- **Target test count**: 8–12 tests across 2 phases

### File Organization
- **New test files**: `frontend/src/__tests__/ActivityFeed.test.tsx` (Phase 1), `frontend/src/__tests__/Board.feed.test.tsx` (Phase 2)
- **Extend existing**: `frontend/src/__tests__/Board.test.tsx` — extend with feed integration cases in Phase 2

### What NOT to Test
- @hello-pangea/dnd internals — the library's drag behavior is tested by its own suite
- Timestamp formatting precision — locale-dependent; assert presence of timestamp element, not exact string
- CSS layout of feed panel — visual regression is out of scope for this task
- Backend API calls — covered by backend test suite; feed has no API dependency

### Per-Phase Test Guidance
- Phase 1: 4–6 tests — ActivityFeed renders empty state when entries=[], renders list of entries, renders each entry's cardTitle/fromColumn/toColumn/timestamp, renders no more than 20 entries when given 21
- Phase 2: 4–6 tests — Board onDragEnd adds entry to feed when source !== destination, Board onDragEnd does NOT add entry when source === destination, feed entries are in reverse-chronological order after multiple moves, feed caps at 20 and drops oldest

## Implementation Roadmap

- [x] Phase 1: ActivityFeed component + types (ActivityFeedEntry type, ActivityFeed component, empty state, entry rendering, 20-entry cap logic)
- [ ] Phase 2: Wire feed into Board.tsx onDragEnd (extend onDragEnd from TASK-005 Phase 2, prepend entry on cross-column drop, integrate ActivityFeed render into Board layout)

## Creative Phases

(none — Level 2, scoped to ≤2 phases)

---

## Execution State

**Build Status**: RUNNING
**Current Build**: Phase 1: ActivityFeed component + types (TASK-006)
**Build Started**: 2026-06-16
**Phase Number**: 1 of 2
**Is Multi-Phase**: YES

### Current Build Step
**Step**: Step 11 - Git Commit
**Status**: RUNNING
**Started**: 2026-06-16

### Completed Steps (Build)
- Step 0.5 Git Setup: COMPLETE (2026-06-16) — branch feature/FEAT-005-realtime-activity-feed created
- Step 1 Read Task Context: COMPLETE (2026-06-16) — Phase 1 of 2 identified
- Step 2 Load Context: COMPLETE (2026-06-16) — Level 2 rules loaded
- Step 3 Test Writer: COMPLETE (2026-06-16) — 6 tests in ActivityFeed.test.tsx
- Step 4 Coding Agent: COMPLETE (2026-06-16) — ActivityFeed.tsx + ActivityFeedEntry type
- Step 5-7 Test/Build/Lint: COMPLETE (2026-06-16) — 18/18 PASS, build PASS, lint PASS
- Step 8 Code Reviewer: COMPLETE (2026-06-16) — APPROVED, 2 recommended fixes applied
- Step 9 Documentation: COMPLETE (2026-06-16) — techContext, systemPatterns, productBrief updated
- Step 10 Memory Bank: COMPLETE (2026-06-16) — progress.md, tasks.md, TASK-006.md updated

### Completed Steps
- Step 0: Parsed task006 → auto-provisioned TASK-006 for FEAT-005
- Step 0.1: Created task file and registry entry
- Step 0.2: Phase gate passed
- Step 3 Spec Writer Agent: COMPLETE (2026-06-16) — taxonomy CLEAN, 9 ACs

### Sub-Agents
(none yet)

### Resumption Notes
**Can Resume**: YES
**Resume From**: Step 0.5 Git Setup
**Notes**: New build started for Phase 1
