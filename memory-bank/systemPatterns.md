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

## Last Refreshed

2026-06-16 — Updated after TASK-006 Phase 1 completion; added Frontend Component Patterns section (Presentational Component, Shared Type Module, ARIA Live Region, Frontend Testing Pattern)

## Domain Event Pattern

Card actions (create, move, label, assign, delete) emit domain events.

Consumers subscribe to event streams rather than polling.

Events: timestamp, actor, action type, card ID, before/after state.

In-process emitter for v1; design for future message bus.
