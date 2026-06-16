# TASK-005: Simple Frontend Kanban Board

**Complexity**: Level 2 (user-capped; natural eval = Level 3)
**Max Phases**: 2 (user-enforced)
**Status**: PLANNING_COMPLETE
**Roadmap**: FEAT-004
**Branch**: feature/FEAT-004-simple-frontend-kanban-board
**Worktree**: N/A

## Task Description

Build a minimal React/TypeScript frontend kanban board with:
- 3 fixed columns: **Todo**, **In Progress**, **Done**
- Drag-and-drop card movement between columns
- Cards display at minimum a title
- Connects to the existing Express backend (boards API on port 3001)
- Scoped to ≤2 implementation phases per user constraint

Stack from techContext.md:
- React + TypeScript
- Vite (recommended build tool)
- @hello-pangea/dnd (recommended DnD library)
- Backend: `http://localhost:3001`

## Specification

**Feature Type**: End-User Feature
**Primary Persona**: Dev Team Member — software developer who needs to see what's in progress, move their own cards, and know what's blocked. Also serves Team Lead who needs the full board visible at a glance.
**Creative Exploration Needed**: No

### Invocation Method

- **Location**: Browser root at `http://localhost:5173` (Vite default dev port). The `frontend/` directory does not yet exist and will be scaffolded in Phase 1 using `npm create vite@latest`.
- **Element**: Kanban board rendered as the single root-level page component (`frontend/src/App.tsx`). No routing required — board is the only view in MVP scope.
- **Visibility**: Always visible — no auth in scope for this task.
- **Navigation**: Open browser → board visible immediately; no login, no redirect.
- **Confidence**: HIGH — requirements are explicit, Vite + React + TypeScript is a well-defined scaffold, no ambiguity in entry point.

### Success Criteria

- **User sees**: 3 labeled columns (Todo, In Progress, Done) rendered horizontally; each column contains 0 or more draggable cards displaying at minimum a card title; columns are distinguishable by label text.
- **Verifiable at**: `http://localhost:5173` after running `npm run dev` inside `frontend/`.
- **Data persisted**: Cards are held in React component state (in-memory, `useState`). No backend persistence required in MVP — backend API is wired for board listing (`GET /boards` at `http://localhost:3001`) but card data is not yet persisted server-side.
- **Observable within**: Page load < 2s on localhost (per productBrief NFR); drag-and-drop response < 100ms perceived.

### Acceptance Criteria

#### AC-ENTRY-1: User sees the kanban board immediately on opening the app
**Priority**: MUST
**Given** the user runs `npm run dev` inside `frontend/` and the Vite dev server starts on port 5173
**When** they open `http://localhost:5173` in any supported browser (Chrome, Firefox, Safari, Edge — latest 2 versions)
**Then** the page renders a kanban board with exactly 3 visible, labeled columns: **Todo**, **In Progress**, **Done** — in that left-to-right order — without requiring any login or further navigation

#### AC-HAPPY-1: User sees initial seed cards in the correct columns
**Priority**: MUST
**Given** the board renders with at least 3 pre-seeded in-memory cards distributed across columns
**When** the user views the board
**Then** each card displays its title text; each card appears in the column matching its initial column assignment; no card is shown in a wrong column

#### AC-HAPPY-2: User drags a card from one column to another and the move persists within the session
**Priority**: MUST
**Given** the user can see at least one card in a column
**When** they drag that card and drop it onto a different column
**Then**
  1. The card appears in the target column immediately after drop (no page reload required)
  2. The card is removed from the source column
  3. The card retains its title after the move
  4. Subsequent drags from the new position work correctly

#### AC-HAPPY-3: Board fetches and displays existing boards from the backend API
**Priority**: SHOULD
**Given** the Express backend is running at `http://localhost:3001`
**When** the frontend loads
**Then** the app successfully calls `GET /boards` and the response is received without a CORS or network error; the board title displayed in the UI reflects the first board from the API response (or a fallback label if no boards exist)

#### AC-ERROR-1: Each column renders an accessible empty state when it contains no cards
**Priority**: MUST
**Given** a column contains zero cards (either initially or after all cards have been dragged away)
**When** the user views that column
**Then** the column still renders with its label visible and a drop target area that accepts drags; no JavaScript error is thrown; no layout breakage occurs

#### AC-ERROR-2: Board renders without crashing when the backend API is unreachable
**Priority**: MUST
**Given** the backend at `http://localhost:3001` is not running or returns an error
**When** the frontend loads
**Then** the kanban board still renders with its 3 columns and in-memory seed cards; a non-blocking error indicator (e.g., console warning or subtle UI note) communicates the API is unavailable; the app does not crash or show a blank page

### Scope Boundaries

- **In scope**:
  - `frontend/` directory scaffolded with Vite + React + TypeScript (`npm create vite@latest`)
  - 3 fixed columns: Todo, In Progress, Done (column names are not configurable in this task)
  - Cards with at minimum a `title` string field
  - In-memory card state managed via React `useState`
  - Drag-and-drop card movement between columns using `@hello-pangea/dnd`
  - `GET /boards` API call to backend on mount (display board title; graceful fallback if API unreachable)
  - Basic empty-state per column
  - Keyboard focus indicators (WCAG 2.1 AA baseline)
  - Vite dev server at `http://localhost:5173`

- **Out of scope**:
  - Card persistence to the backend (no POST/PATCH for cards — columns and cards API not yet implemented)
  - Card creation UI (no "add card" form in this task)
  - Card editing, deletion, or detail view
  - Authentication or user identity
  - Real-time sync / WebSockets / polling
  - Custom column names or reordering
  - Label filtering
  - Mobile drag-and-drop (best-effort per productBrief; not a blocking requirement)
  - Docker Compose integration for the frontend container
  - Production build / Dockerfile for frontend

- **Dependencies**:
  - Backend running at `http://localhost:3001` (for `GET /boards`; graceful fallback if absent)
  - `CORS_ALLOWED_ORIGINS` configured on backend to allow `http://localhost:5173` (already implemented via TASK-003 env var)
  - Node.js available locally to run Vite dev server

- **NFR implications** (from productBrief):
  - Page load < 2s on localhost
  - Drag-and-drop perceived response < 100ms
  - Keyboard navigation required (WCAG 2.1 AA)
  - Color contrast compliance for column labels and card text
  - Strict TypeScript (`"strict": true`) matching backend convention

### Creative Exploration Needed

Specification is concrete — proceed to implementation planning.

## Test Strategy

### Approach
- **Emphasis**: Unit tests for components + integration for DnD behavior
- **Target test count**: 8–12 tests across 2 phases

### File Organization
- **New test files**: `frontend/src/__tests__/Board.test.tsx`, `frontend/src/__tests__/Column.test.tsx`
- **Extend existing**: None (frontend is new)

### What NOT to Test
- Vite build pipeline — covered by framework
- Browser drag event internals — covered by @hello-pangea/dnd
- Backend API internals — covered by backend test suite

### Per-Phase Test Guidance
- Phase 1: 5–7 tests — Board renders, columns present, cards render in correct column
- Phase 2: 3–5 tests — DnD moves card between columns, empty state renders

## Implementation Roadmap

- [x] Phase 1: Frontend scaffold + static board layout (Vite + React + 3 columns)
- [ ] Phase 2: Drag-and-drop card movement (@hello-pangea/dnd integration)

## Creative Phases

(none — Level 2, scoped to ≤2 phases)

---

## Execution State

**Build Status**: PHASE_1_COMPLETE
**Current Phase**: Phase 2: Drag-and-drop card movement
**Phase Number**: 2 of 2
**Is Multi-Phase**: YES
**Build Started**: 2026-06-16

### Current Build Step
**Step**: Awaiting Phase 2
**Status**: IDLE

### Completed Steps
- Step 0: Parsed FEAT-004 → created TASK-005
- Step 0.1: Auto-provisioned task file and registry entry
- Step 0.2: Phase gate passed
- Step 1 Read Task Context: COMPLETE (2026-06-16) - Phase 1 identified
- Step 2 Load Context: COMPLETE (2026-06-16) - Level 2 rules loaded
- Step 3 Tests Written: COMPLETE (2026-06-16) - 8 tests in Board.test.tsx + Column.test.tsx
- Step 4 Coding: COMPLETE (2026-06-16) - Board, Column, Card components; types.ts, api.ts
- Step 6 Test Execution: COMPLETE (2026-06-16) - 8/8 passing
- Step 7 Build Verification: COMPLETE (2026-06-16) - tsc + vite build PASS
- Phase 1 Git Commit: COMPLETE (2026-06-16) - committed to feature/FEAT-004-simple-frontend-kanban-board

### Resumption Notes
**Can Resume**: YES
**Resume From**: Phase 2 - Step 3 Test Writer
**Notes**: Phase 1 complete. Run /banyan-build TASK-005 for Phase 2 (DnD integration)
