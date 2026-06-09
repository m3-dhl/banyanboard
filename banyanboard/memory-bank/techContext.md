# Tech Context

## Technology Stack

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **State**: TBD (Redux Toolkit / Zustand / React Query)
- **DnD**: TBD (recommended: @hello-pangea/dnd)
- **Build**: TBD (Vite recommended)

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Architecture**: Clean architecture — simple layered approach (routes → controllers → services → repositories)

### Database
- **Engine**: PostgreSQL
- **Migrations**: TBD (node-pg-migrate or similar)
- **ORM/Query builder**: TBD (pg / Drizzle / Knex)

### Infrastructure
- **Local Dev**: Docker Compose (`docker compose up` — single command startup)
- **Services**: frontend container, backend container, postgres container

## Development Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop
docker compose down

# Rebuild after code changes
docker compose up --build
```

> Note: Commands to be confirmed once docker-compose.yml is created.

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

2026-06-09
