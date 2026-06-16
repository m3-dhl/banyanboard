# Tech Context

## Technology Stack

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **State**: TBD (Redux Toolkit / Zustand / React Query)
- **DnD**: TBD (recommended: @hello-pangea/dnd)
- **Build**: TBD (Vite recommended)

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
- **Frontend**: Not yet scaffolded

## Development Commands

```bash
# Docker (primary local dev)
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

2026-06-16
