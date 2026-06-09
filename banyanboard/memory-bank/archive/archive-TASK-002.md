# Archive: Board CRUD Endpoints

## Metadata
- **Task ID**: TASK-002
- **Complexity**: Level 2
- **Feature**: FEAT-002
- **Branch**: feature/board-crud
- **Build Commit**: 564c635
- **Reflection Commit**: bcadbde
- **Completed**: 2026-06-09

## Summary

Delivered a complete Board CRUD REST API with full clean-architecture layering: five endpoints (GET /boards, GET /boards/:id, POST /boards, PATCH /boards/:id, DELETE /boards/:id), PostgreSQL persistence via pg Pool singleton, TypeScript interfaces, server-side validation, and 18 passing tests. All 8 acceptance criteria met; test count exceeded the 15-test target by three edge-case assertions. Build completed in 14 minutes through a 7-agent TDD-first pipeline.

## Solution

Implemented the four-layer clean architecture pattern: types → db/pool → repository → service → controller → routes → app mount.

Key implementation choices:
- **Mock at repository layer** — `jest.mock('../repositories/board.repository')` validates all layers above while removing DB I/O from the test cycle
- **ValidationError in service layer** — domain error defined where business logic lives; controllers do `instanceof ValidationError` discrimination
- **pg Pool singleton** — `db/pool.ts` creates one Pool at module load from `DATABASE_URL`; Node module cache ensures one pool per process
- **PATCH via COALESCE** — `COALESCE($2, title)` avoids dynamic SQL; safe from injection; trade-off is future multi-field updates need more COALESCE expressions

## Files Changed

| File | Change |
|------|--------|
| `backend/src/types/board.types.ts` | Created — Board, CreateBoardDto, UpdateBoardDto interfaces |
| `backend/src/db/pool.ts` | Created — pg Pool singleton reading DATABASE_URL |
| `backend/src/db/migrations/001_create_boards.sql` | Created — DDL for boards table (UUID PK, title VARCHAR(100)) |
| `backend/src/repositories/board.repository.ts` | Created — CRUD queries; rowToBoard mapper for snake_case→camelCase |
| `backend/src/services/board.service.ts` | Created — business logic, ValidationError class, title validation (1-100 chars) |
| `backend/src/controllers/board.controller.ts` | Created — Express handlers, try/catch with ValidationError discrimination |
| `backend/src/routes/board.routes.ts` | Created — Router wiring for all 5 endpoints |
| `backend/src/app.ts` | Modified — mounted /boards router |
| `backend/package.json` | Modified — added `pg` + `@types/pg` |
| `backend/src/__tests__/board.test.ts` | Created — 18 tests: supertest + jest.mock on repository |

## Test Results

- **Total**: 18/18 passing (target: 15)
- **Typecheck**: CLEAN (`tsc --noEmit`)
- **Code Review**: APPROVED, 0 blocking issues, Security PASS
- **Extra tests**: PATCH title-too-long edge case + POST shape assertion (id, createdAt, updatedAt)

## Technical Debt Deferred

1. **Logger abstraction** — 500-catch blocks in controllers silently discard errors. No `console.log` violation but observability-blind. Add pino/winston before next feature.
2. **Migration runner** — `001_create_boards.sql` has no automated execution path. Add `node-pg-migrate` or similar before first deployed version.
3. **PATCH multi-field** — COALESCE approach handles one optional field cleanly; will need query builder or more COALESCE columns when Board gains description/color/archived fields.

## Notes

- TDD-first (Test Writer Agent writes contracts before Coding Agent implements) produced zero-rework build — enforce for all Level 2+ tasks
- TASK-001 learned rule (app/server split) applied directly in board tests — confirmed reusable, feedback loop working
- `.agent-logs/` directory still missing; build metrics unavailable
- UAT skipped (pure backend API, no browser surface); needs API-testing equivalent for Level 2 quality gate on backend-only tasks
