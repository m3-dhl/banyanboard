# BanyanBoard

Kanban board for small teams. Create boards with columns, move cards, track work.

## Quick Start

```bash
docker compose up
```

Verify: `curl http://localhost:3001/health`

Expected response:
```json
{ "status": "ok", "timestamp": "2026-06-09T10:00:00.000Z" }
```

## Local Development (without Docker)

```bash
cd backend
npm install
npm run dev
```

Environment variables (create `backend/.env`):
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/banyanboard
```

## Running Tests

```bash
cd backend
npm install
npm test
```

## Type Checking

```bash
cd backend
npm run typecheck
```

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | TypeScript + Express |
| Database | PostgreSQL 16 |
| Infrastructure | Docker Compose |

## Project Structure

```
banyanboard/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic (future)
│   │   ├── repositories/    # Data access (future)
│   │   └── __tests__/       # Integration tests
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```
