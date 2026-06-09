# TASK-002: Board CRUD Endpoints

**Complexity**: Level 2
**Status**: INITIALIZED
**Roadmap Link**: FEAT-002
**Feature Branch**: feature/FEAT-002-board-crud-endpoints
**Worktree**: N/A
**Created**: 2026-06-09

## Task Description

Create a `Board` model with full CRUD REST endpoints and comprehensive tests:

- `GET /boards` — list all boards
- `GET /boards/:id` — get board by ID (404 if not found)
- `POST /boards` — create board (400 on missing/invalid title)
- `PATCH /boards/:id` — update board title (400 on empty body, 404 if not found)
- `DELETE /boards/:id` — delete board (204; 404 if not found)

Follow existing clean architecture: routes → controllers → services → repositories.  
Use `pg` (PostgreSQL) for persistence. `DATABASE_URL` is set via env (see `docker-compose.yml`).  
Tests mock the repository layer with `jest.mock` so they run without a live DB.

## Board Model

```typescript
interface Board {
  id: string;        // UUID (gen_random_uuid())
  title: string;     // 1–100 characters, required
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBoardDto { title: string; }
interface UpdateBoardDto { title?: string; }
```

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/types/board.types.ts` | CREATE | Board, CreateBoardDto, UpdateBoardDto interfaces |
| `backend/src/db/pool.ts` | CREATE | pg Pool singleton, reads DATABASE_URL |
| `backend/src/db/migrations/001_create_boards.sql` | CREATE | DDL for boards table |
| `backend/src/repositories/board.repository.ts` | CREATE | CRUD queries via pg |
| `backend/src/services/board.service.ts` | CREATE | Business logic + validation |
| `backend/src/controllers/board.controller.ts` | CREATE | Express request handlers |
| `backend/src/routes/board.routes.ts` | CREATE | Router wiring |
| `backend/src/app.ts` | MODIFY | Mount `/boards` router |
| `backend/package.json` | MODIFY | Add `pg` + `@types/pg` |
| `backend/src/__tests__/board.test.ts` | CREATE | Comprehensive tests (see below) |

## SQL Schema

```sql
CREATE TABLE IF NOT EXISTS boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Test Strategy

**Approach**: supertest integration tests + `jest.mock` on `board.repository`  
**Target test count**: ~15 tests  
**No live DB required** — repository is mocked at module level

### Test Cases

| # | Test | Expected |
|---|------|----------|
| 1 | GET /boards → returns 200 | HTTP 200 |
| 2 | GET /boards → returns array | body is array |
| 3 | GET /boards/:id (exists) | 200 + board object |
| 4 | GET /boards/:id (not found) | 404 |
| 5 | POST /boards (valid title) | 201 + created board |
| 6 | POST /boards (missing title) | 400 |
| 7 | POST /boards (title too long >100) | 400 |
| 8 | POST /boards (empty string title) | 400 |
| 9 | PATCH /boards/:id (valid) | 200 + updated board |
| 10 | PATCH /boards/:id (not found) | 404 |
| 11 | PATCH /boards/:id (empty body) | 400 |
| 12 | PATCH /boards/:id (title too long) | 400 |
| 13 | DELETE /boards/:id (exists) | 204 |
| 14 | DELETE /boards/:id (not found) | 404 |
| 15 | POST /boards → board has id, createdAt, updatedAt | shape validation |

### What NOT to Test
- pg Pool internals (framework responsibility)
- SQL query syntax (repository mock makes this irrelevant)
- Docker Compose wiring (manual smoke test)

## Acceptance Criteria

- AC-001: `GET /boards` returns HTTP 200 + JSON array
- AC-002: `GET /boards/:id` returns 200 + board; 404 if missing
- AC-003: `POST /boards` with `{ title }` returns 201 + full board object; 400 on invalid input
- AC-004: `PATCH /boards/:id` with `{ title }` returns 200 + updated board; 400/404 on errors
- AC-005: `DELETE /boards/:id` returns 204; 404 if not found
- AC-006: All 15 tests pass (`npm test` inside backend)
- AC-007: `tsc --noEmit` clean (no type errors)
- AC-008: Board title validated: 1–100 chars, required

## Dependencies to Install

```bash
npm install pg
npm install --save-dev @types/pg
```
(Run inside `backend/` directory)

## Implementation Roadmap

- [ ] Phase 1: Board CRUD — types, db/pool, repository, service, controller, routes, tests

## Creative Phases

(none — Level 2)

---

## Execution State

## Build Execution State

**Build Status**: RUNNING
**Current Build**: Phase 1: Board CRUD (TASK-002)
**Build Started**: 2026-06-09T00:00:00Z
**Phase Number**: 1 of 1
**Is Multi-Phase**: NO

### Current Build Step
**Step**: Step 0.5 - Git Setup
**Status**: RUNNING
**Started**: 2026-06-09T00:00:00Z

### Completed Steps
- Step 0 Parse Task ID: COMPLETE — TASK-002 found
- Step 0.1 Resumption Check: COMPLETE — New build (IDLE state)
- Step 0.1 Agent Rules: COMPLETE — No rules configured, skip

### Sub-Agents
(none yet)

### Resumption Notes
**Can Resume**: NO
**Resume From**: Step 0.5
**Notes**: Starting first build
