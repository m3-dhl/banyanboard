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

## Directory Structure

```
backend/
├── src/
│   ├── __tests__/           # Integration tests (supertest)
│   │   └── health.test.ts
│   ├── controllers/         # Request handlers
│   │   └── health.controller.ts
│   ├── routes/              # Express routers
│   │   └── health.routes.ts
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
- No hardcoded values in source; all config via `process.env`

### Request Handler Signature
```typescript
export function handlerName(req: Request, res: Response): void { ... }
```

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

**What NOT to test**:
- Docker Compose startup (manual smoke test)
- TypeScript compilation (covered by `tsc --noEmit`)
- Express framework internals

## Last Refreshed

2026-06-09 — Updated after TASK-001 completion; patterns extracted from working implementation
