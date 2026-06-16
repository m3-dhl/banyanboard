# Tech Context

## Technology Stack

### Frontend
- **Framework**: React ^19.2.6
- **Language**: TypeScript ~6.0.2 (strict mode)
- **Build**: Vite ^8.0.12 — `npm run dev` starts dev server on port 5173
- **DnD**: @hello-pangea/dnd ^18.0.1 — drag-and-drop card movement (TASK-005)
- **State**: React `useState` (local component state; no external state library)
- **Testing**: Vitest ^4.1.9 + @testing-library/react ^16.3.2 + jsdom
- **Test runner**: `npm test` runs `vitest run`; `npm run test:watch` for watch mode
- **Config files**: `frontend/tsconfig.json`, `frontend/vite.config.ts`
- **Component structure**: `frontend/src/components/` (presentational components); `frontend/src/types.ts` (shared types)

### Backend
- **Runtime**: Node.js 20-alpine
- **Framework**: Express ^4.21.0
- **Language**: TypeScript ^5.6.0 (target: ES2022, strict mode)
- **Architecture**: Clean architecture — layered (routes → controllers → services → repositories)
- **Config files**: `backend/tsconfig.json`, `backend/jest.config.ts`
- **CORS**: `cors` ^2.x — configured via `backend/src/config/cors.ts`; env vars: `CORS_ALLOWED_ORIGINS`, `CORS_ALLOWED_METHODS`, `CORS_ALLOWED_HEADERS` (defaults: `*`, all methods, `Content-Type,Authorization`)

### Testing
- **Framework**: Jest ^29.7.0 + Supertest ^7.0.0
- **Runner**: ts-jest ^29.2.6
- **Pattern**: `**/__tests__/**/*.test.ts`
- **Approach**: Integration tests via supertest against app factory (no live server)

### Database
- **Engine**: PostgreSQL 16-alpine
- **Client**: `pg` ^8.x (installed — TASK-002)
- **Migrations**: SQL script files in `backend/src/db/migrations/` (e.g., `001_create_boards.sql`)
- **Connection**: `DATABASE_URL` env var (`postgresql://postgres:postgres@db:5432/banyanboard`)
- **Pool**: Singleton `pool` exported from `backend/src/db/pool.ts`

### Infrastructure
- **Local Dev**: Docker Compose (`docker compose up` — single command startup)
- **Services**: backend container (port 3001), postgres container (port 5432)
- **Dockerfile**: Multi-stage build — builder stage (tsc) + runner stage (prod deps only)
- **Frontend**: Scaffolded at `frontend/` — served separately via `npm run dev` (port 5173)

## Development Commands

```bash
# Docker (primary local dev — backend + postgres)
docker compose up            # Start backend + postgres
docker compose up -d         # Background
docker compose down          # Stop
docker compose up --build    # Rebuild after code changes

# npm (inside backend/ directory)
npm run dev        # ts-node development server
npm run build      # TypeScript compilation (tsc)
npm start          # Run compiled dist/server.js
npm test           # Run Jest test suite
npm run typecheck  # tsc --noEmit (type check only)

# npm (inside frontend/ directory)
npm run dev        # Vite dev server (port 5173, HMR)
npm run build      # tsc + Vite production build
npm test           # Vitest run (single pass)
npm run test:watch # Vitest watch mode
npm run lint       # ESLint
```

## Environment Setup

1. Install Docker Desktop
2. Clone repo
3. `docker compose up`
4. Open browser at `http://localhost:3000` (or configured port)

## Key Principles

- Simplicity over clever abstractions
- Clean architecture (layered, not over-engineered)
- No microservices — monolithic backend is correct for this scale
- Docker Compose is the only local dependency

## Last Refreshed

2026-06-16 — Updated after TASK-006 Phase 1 completion; frontend stack details added (Vite, React 19, TypeScript 6, Vitest, @hello-pangea/dnd); frontend dev commands added; "Frontend: Not yet scaffolded" corrected
