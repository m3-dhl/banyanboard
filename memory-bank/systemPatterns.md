# System Patterns

## Guiding Principles

| Principle | Description |
|-----------|-------------|
| Separation of Concerns | Distinct layers: routes → controllers → services → repositories |
| Type Safety | Strict TypeScript; `"strict": true`; no `any` |
| Testability | App factory pattern: `app.ts` exports Express instance; `server.ts` owns HTTP listen |
| Zero Over-Engineering | YAGNI: services/repositories added only when features need them |
| Clean Container Patterns | Multi-stage Docker builds; health checks to prevent startup race conditions |
| Observability Required | No bare `console.log` in production code; structured logging required before business logic |
| Configuration as Code | All configuration via environment variables with sensible defaults; middleware configured via factory functions |

## Architecture Overview

**Stack**: Express.js + TypeScript + PostgreSQL (Docker Compose)

**Entry Point Flow**:
- `src/server.ts` → HTTP listener, starts app on configured PORT
- `src/app.ts` → Express factory (middleware + routes), exportable for testing
- `src/routes/` → Route definitions (delegate to controllers)
- `src/controllers/` → Request/response handlers
- `src/services/` → Business logic (added when features need it)
- `src/repositories/` → DB queries via pg (added when features need it)

**Current endpoints**:
- `GET /health` → `{ status: "ok", timestamp: ISO-8601 }`
- `GET /boards` → `Board[]`
- `GET /boards/:id` → `Board` | 404
- `POST /boards` → `Board` (201) | 400
- `PATCH /boards/:id` → `Board` | 400 | 404
- `DELETE /boards/:id` → 204 | 404

## Directory Structure

```
backend/
├── src/
│   ├── __tests__/           # Integration tests (supertest)
│   │   ├── health.test.ts
│   │   ├── board.test.ts
│   │   ├── cors.test.ts
│   │   └── validation.test.ts
│   ├── controllers/         # Request handlers
│   │   ├── health.controller.ts
│   │   └── board.controller.ts
│   ├── db/                  # Database layer
│   │   ├── pool.ts          # pg Pool singleton
│   │   └── migrations/      # SQL DDL scripts
│   │       └── 001_create_boards.sql
│   ├── repositories/        # DB queries
│   │   └── board.repository.ts
│   ├── config/              # Environment-based configuration factories
│   │   └── cors.ts          # buildCorsOptions() — parses CORS_* env vars
│   ├── middleware/          # Express error-handling middleware
│   │   └── json-error.ts
│   ├── routes/              # Express routers
│   │   ├── health.routes.ts
│   │   └── board.routes.ts
│   ├── services/            # Business logic + validation
│   │   └── board.service.ts
│   ├── types/               # Shared TypeScript interfaces
│   │   └── board.types.ts
│   ├── app.ts               # Express factory (no HTTP listen)
│   └── server.ts            # Entry point (listen on PORT)
├── dist/                    # Compiled output (git-ignored)
├── Dockerfile               # Multi-stage build (builder + runner)
├── jest.config.ts           # Jest: ts-jest preset, node env
├── tsconfig.json            # Strict: true, target ES2022
└── package.json
```

## Key Patterns & Conventions

### App/Server Split (Testability)
- `app.ts` exports the Express instance without calling `.listen()`
- `server.ts` imports `app` and binds to a port
- Tests import `app` directly → `supertest(app)` makes requests without starting a server

### Docker Multi-Stage Build
- **Stage 1 (builder)**: Install all deps → run `tsc` → produce `dist/`
- **Stage 2 (runner)**: Fresh base image, copy `dist/` + prod deps only → smaller final image
- Exposed port: 3001

### Docker Compose Health Check
- Backend `depends_on: { db: { condition: service_healthy } }` — prevents race on startup
- DB has `healthcheck: pg_isready` with 5s interval

### Configuration via Environment
- `PORT` — HTTP listen port (default 3001)
- `NODE_ENV` — `development` in Compose
- `DATABASE_URL` — `postgresql://postgres:postgres@db:5432/banyanboard`
- `CORS_ALLOWED_ORIGINS` — comma-separated origins (default: `*`)
- `CORS_ALLOWED_METHODS` — comma-separated methods (default: `GET,HEAD,PUT,PATCH,POST,DELETE`)
- `CORS_ALLOWED_HEADERS` — comma-separated headers (default: `Content-Type,Authorization`)
- No hardcoded values in source; all config via `process.env`

### Config Factory Pattern
Config modules export factory functions that read env vars and return typed options objects:
```typescript
// src/config/cors.ts
export function buildCorsOptions(): CorsOptions { ... }
```
Middleware wired in `app.ts` as `app.use(cors(buildCorsOptions()))`.

### Request Handler Signature
```typescript
export function handlerName(req: Request, res: Response): void { ... }
```

### Validation Error Pattern
Services export `ValidationError extends Error` for domain validation failures. Controllers catch it and return 400:
```typescript
// service
export class ValidationError extends Error { ... }
function validateX(x: string): void { if (!x) throw new ValidationError('...'); }

// controller
} catch (err) {
  if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
  res.status(500).json({ error: 'Internal server error' });
}
```

### Error Handling Pattern

All API errors return structured JSON with three fields: `code` (machine-readable string), `message` (human-readable), and `details` (optional extra context). Domain-specific error classes extend a shared `AppError` base:

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Extend for domain-specific errors
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}
```

Controllers catch `AppError` subclasses and forward their structured payload; unknown errors fall back to a generic 500:
```typescript
} catch (err) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.code, message: err.message, details: err.details });
    return;
  }
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
}
```

Response shape:
```json
{ "code": "VALIDATION_ERROR", "message": "Title is required and cannot be empty", "details": null }
```

- **Problem**: Ad-hoc error shapes (`{ error: string }`) can't be reliably parsed by clients or logged by monitoring tools
- **Trade-offs**: Adds `AppError` base class dependency; worth it once there are multiple error types across services

### JSON Error Handler Pattern
Express error-handling middleware (4-param `(err, req, res, next)` signature) placed in `src/middleware/json-error.ts`, registered in `app.ts` after `express.json()` and before routes. Intercepts `SyntaxError` parse failures from the body parser and returns a structured `{ error: string }` 400 response instead of crashing the request:
```typescript
export function jsonErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof SyntaxError) { res.status(400).json({ error: err.message }); return; }
  next(err);
}
```

### Repository Pattern
Repositories use parameterized pg queries and map snake_case columns to camelCase via a `rowToX` helper:
```typescript
function rowToBoard(row: Record<string, unknown>): Board { ... }
```
All queries use `$1`, `$2` placeholders — no string interpolation.

## Testing Patterns

**Framework**: Jest + Supertest

**File location**: `backend/src/__tests__/`

**File naming**: `*.test.ts`

**Test structure**:
```typescript
import request from 'supertest';
import app from '../app';

describe('GET /endpoint', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/endpoint');
    expect(res.status).toBe(200);
  });
});
```

**Current test coverage**:
- `health.test.ts`: 3 tests (HTTP 200, `status: "ok"`, valid ISO timestamp)
- `board.test.ts`: 18 tests — full CRUD (list, get by id, create, update, delete); mocked repository pattern
- `cors.test.ts`: CORS preflight, simple requests, header validation
- `validation.test.ts`: 7 tests — malformed JSON body returns 400, valid JSON proceeds normally

**Total**: 29 tests

**What NOT to test**:
- Docker Compose startup (manual smoke test)
- TypeScript compilation (covered by `tsc --noEmit`)
- Express framework internals

## Frontend Component Patterns

These patterns apply to all React components under `frontend/src/components/`.

### Presentational Component Pattern

Components receive all data via props and own no fetch logic. State lives in the nearest stateful ancestor (currently `Board.tsx`) and is passed down. This keeps components independently testable with `@testing-library/react` without mocking network calls.

**Two-tier distinction** (added TASK-017):
- **Stateful feature containers** (`Board.tsx`, `CardDetailModal.tsx`) — own state and fetch logic for their own feature scope; analogous to pages. These are the exception.
- **Presentational leaf components** (`ActivityFeed`, `CommentsThread`, `MarkdownRenderer`) — fully prop-driven, no fetch calls. These are the rule.

The pattern's intent is that leaf-level UI components stay decoupled from network calls — not that all state must bubble to `Board.tsx`. A self-contained feature modal is a justified stateful container.

- **Problem**: Components that own their own fetch logic are tightly coupled to backend availability
- **Implementation**: `ActivityFeed` receives `entries: ActivityFeedEntry[]` — it does not know how entries were produced
- **Trade-offs**: Slight prop-drilling overhead; acceptable at this scale
- **Example**: `frontend/src/components/ActivityFeed.tsx`

### Shared Type Module

All domain types (`ColumnId`, `CardData`, `ColumnData`, `ActivityFeedEntry`) and compile-time constants (`COLUMNS`, `SEED_CARDS`) are co-located in `frontend/src/types.ts`. Components import only what they need. This avoids scattered type declarations and ensures the canonical column-label mapping (`COLUMNS`) is a single source of truth.

- **Example**: `frontend/src/types.ts`

### ARIA Live Region for Activity Feeds

Dynamically updating lists that convey status (such as card movement history) use `role="log"` with `aria-live="polite"`. This allows screen readers to announce new entries without interrupting the user's current focus. The outer container uses `role="log"`; the parent section carries an `aria-label` to identify the region.

```tsx
<section aria-label="Activity feed">
  <div role="log" aria-label="Recent card moves" aria-live="polite">
    <ul>...</ul>
  </div>
</section>
```

- **Problem**: Dynamic list updates are silent to assistive technology without an ARIA live region
- **Implementation**: `frontend/src/components/ActivityFeed.tsx`
- **Guiding Principle alignment**: Supports the WCAG 2.1 AA accessibility NFR in `productBrief.md`

### Frontend Testing Pattern

**Framework**: Vitest + @testing-library/react + jsdom

**File location**: `frontend/src/__tests__/`

**File naming**: `*.test.tsx`

**Test structure**: Render component with props via `render()`, assert via `screen` queries, verify ARIA roles are present:
```tsx
import { render, screen } from '@testing-library/react';
import ActivityFeed from '../components/ActivityFeed';

describe('ActivityFeed', () => {
  it('shows empty state when entries is empty', () => {
    render(<ActivityFeed entries={[]} />);
    expect(screen.getByText('No activity yet.')).toBeInTheDocument();
  });
});
```

**Current test coverage (frontend)**:
- `ActivityFeed.test.tsx`: 6 tests — empty state, single entry render, multiple entries, 20-entry cap, column label resolution, timestamp element

**What NOT to test**:
- @hello-pangea/dnd internals (tested by the library)
- CSS layout or visual regression
- Timestamp formatting precision (locale-dependent)

### ReactDOM Portal for Positioned Overlays Inside DnD Containers

When a positioned overlay (popover, tooltip, dropdown) is rendered as a descendant of a `@hello-pangea/dnd` `Draggable`, the dnd library applies CSS `transform` to the draggable wrapper during drag. CSS transforms create a new stacking context and a new containing block, which breaks `position: fixed` and causes positioned overlays to clip or misplace. The solution is to render the overlay directly into `document.body` via `ReactDOM.createPortal`.

- **Problem**: A `LabelPickerPopover` rendered inside a `Draggable` would be clipped or shift position during drag because of the `transform` applied by dnd
- **Implementation**: `frontend/src/components/LabelPickerPopover.tsx` uses `ReactDOM.createPortal(content, document.body)`
- **Escape-key scoping**: Escape listeners must be attached to the portal container element (not `document`) to avoid intercepting dnd's own keyboard drag handlers, which also use Escape to cancel a keyboard drag
- **Trade-offs**: Portal-rendered content lives outside the React tree's DOM position, so inherited CSS (font, color) still flows via React context but DOM-position-dependent CSS (e.g., `overflow: hidden` on an ancestor) no longer clips the overlay. Acceptable trade-off for overlays that must float above the full viewport.
- **Example**: `frontend/src/components/LabelPickerPopover.tsx`

### Viewport Clamping for Fixed-Position Portals

Portals rendered with `position: fixed` must clamp their `left` coordinate against the right viewport edge. Without clamping, anchors near the right side of the viewport (e.g., rightmost Kanban column) produce overflow that is invisible and inaccessible.

```typescript
const POPOVER_MAX_WIDTH = 280 // must match CSS max-width value
const clampedLeft = Math.min(
  anchorRect.left,
  window.innerWidth - POPOVER_MAX_WIDTH - 8, // 8px safety margin
)
```

- **Problem**: `left: anchorRect.left` with no guard → DONE column anchor at ~x:1050 in a 1280px viewport → popover extends 50px off-screen
- **Rule**: Apply clamping to **every** positioning branch (open-below and open-above). A branch without clamping will overflow when vertical flip triggers
- **Testing**: Mock `window.innerWidth` and `window.innerHeight` via `Object.defineProperty`; assert `parseFloat(dialog.style.left) <= window.innerWidth - POPOVER_MAX_WIDTH - 8`
- **Implementation**: `frontend/src/components/LabelPickerPopover.tsx`
- **Companion pattern**: See ReactDOM Portal for Positioned Overlays Inside DnD Containers (above) — that pattern explains *why* to use a portal; this pattern explains *how to position it correctly*

### useFocusTrap Hook for Accessible Dialogs

Modal dialogs and popovers must trap keyboard focus within themselves while open (WCAG 2.1 success criterion 2.1.2). The `useFocusTrap` hook implements this with a `MutationObserver`-driven focus query limited to the container element, without pulling in a third-party focus-trap library.

- **Problem**: When a dialog opens, Tab/Shift+Tab should cycle only through the dialog's focusable elements, not escape to the page behind it
- **Implementation**: `frontend/src/hooks/useFocusTrap.ts` — accepts a `containerRef` and an `isActive` flag; queries focusable descendants and intercepts Tab keydown events
- **Dep array note**: `containerRef` is intentionally excluded from the `useEffect` dep array because React ref objects are stable across renders (the object identity never changes, only `.current` does). An eslint-disable comment in the file documents this decision.
- **Trade-offs**: Minimal implementation; does not handle edge cases like dynamically added focusable children after initial render (not needed for the current label UI). Upgrade to a library (`focus-trap-react`) if dialogs grow more dynamic.
- **Example**: `frontend/src/hooks/useFocusTrap.ts`; used in `frontend/src/components/LabelManagementPanel.tsx`

### Pointer-Delta Click/Drag Disambiguation

Prevents DnD drag completion from triggering a card-detail open. `onPointerDown` stores the pointer position; `onPointerUp` computes euclidean distance — if < 5px, fires the action.

- **Problem**: `onClick` fires after a drag release, incorrectly opening the detail modal
- **Implementation**: `frontend/src/components/Card.tsx` — pointer position stored in a `useRef`; euclidean distance gate of 5px before `onOpenDetail` is called
- **Trade-offs**: Slightly more code than a simple `onClick`, but correctly separates intentional clicks from drag completions

### React Portal Modal Pattern (Accessible Dialog)

`createPortal(<backdrop + dialog>, document.body)` with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, backdrop click to close, and Escape key handler on the container ref (not `document`) with `stopPropagation`.

- **Problem**: Modals rendered inside DnD Draggable containers are broken by CSS `transform` stacking contexts; Escape listeners on `document` conflict with dnd keyboard drag cancellation
- **Implementation**: `frontend/src/components/CardDetailModal.tsx` — extends the portal pattern established in `DeleteCardDialog.tsx`; Escape listener attached via `ref.current.addEventListener` with `stopPropagation`
- **Trade-offs**: See ReactDOM Portal for Positioned Overlays Inside DnD Containers (above); this entry documents the accessible dialog variant

### AbortController for Fetch Cleanup

`useEffect` creates an `AbortController`, passes its `signal` to all fetch calls inside the effect, and returns `() => controller.abort()` as cleanup. Prevents state updates on unmounted components and cancels in-flight requests when the component unmounts or deps change.

- **Problem**: Async fetch callbacks that call `setState` after unmount produce React warnings and potential memory leaks
- **Implementation**: `frontend/src/components/CardDetailModal.tsx` — one controller per `useEffect` that fetches card detail and comments
- **Trade-offs**: Requires passing `signal` to every fetch call in the effect; easy to miss for secondary requests within the same effect

### Optimistic Comment Add Pattern

Add comment with `pending: true` immediately to local state; on API success replace with the real server response; on API failure remove the optimistic entry and restore the textarea text for retry.

- **Problem**: Network latency makes comment submission feel slow; naive rollback loses the user's text
- **Implementation**: `frontend/src/components/CardDetailModal.tsx` — comment list entry carries `pending?: boolean`; success replaces by temp ID; failure removes and restores `commentText` state
- **Trade-offs**: Slightly more complex state management; textarea text preservation on failure is a UX requirement (AC-ERROR-2)

## Last Refreshed

2026-06-19 — Updated after TASK-017 Phase 2; added Pointer-Delta Click/Drag Disambiguation, React Portal Modal Pattern, AbortController for Fetch Cleanup, and Optimistic Comment Add Pattern

## Domain Event Pattern

Card actions (create, move, label, assign, delete) emit domain events.

Consumers subscribe to event streams rather than polling.

Events: timestamp, actor, action type, card ID, before/after state.

In-process emitter for v1; design for future message bus.
