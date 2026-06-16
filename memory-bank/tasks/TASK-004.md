# TASK-004: Add input validation middleware to validate required fields and reject malformed JSON on Board endpoints

**Complexity**: Level 1
**Status**: BUILD_COMPLETE
**Roadmap**: N/A
**Branch**: task/004-add-input-validation-middleware
**Worktree**: N/A (Level 1 uses direct branch, not worktree)

## Task Description

Add input validation middleware to validate required fields and reject malformed JSON on Board endpoints.

Specifically:
- Validate that required fields are present on POST and PATCH requests to `/boards`
- Reject requests with malformed JSON bodies with a structured 400 error response
- Follow existing `ValidationError` pattern from `board.service.ts`
- Consistent error format with existing handlers: `{ error: "..." }`

## Implementation Notes

- Existing pattern: `ValidationError extends Error` caught in controllers → 400
- Middleware should run before route handlers
- Mount in `app.ts` using the config factory pattern already established
- Test file: `backend/src/__tests__/validation.test.ts` (or extend `board.test.ts`)
- Environment: no new env vars needed

## Implementation Roadmap

- [x] Phase 1: Write validation tests, implement validation middleware (malformed JSON + required fields), wire into Board routes

---

## Execution State

**Build Status**: COMPLETE
**Current Phase**: Phase 1 — COMPLETE
**Phase Number**: 1 of 1
**Is Multi-Phase**: NO
**Build Started**: 2026-06-16
**Can Resume**: NO

### Current Build Step
**Step**: Step 11 — Git Commit
**Status**: COMPLETE
**Completed**: 2026-06-16

### Active Sub-Agents
(none)

### Completed Steps
- Step 0.5 Git Setup: COMPLETE (2026-06-16) — on branch task/004-add-input-validation-middleware
- Step 0.6 Phase Gate: COMPLETE (2026-06-16) — Implementation Roadmap present, Level 1 ✓
- Step 1 Read Task Context: COMPLETE (2026-06-16) — single phase, Level 1
- Step 2 Load Context: COMPLETE (2026-06-16) — Level 1 rules loaded
- Step 3 Test Writer: COMPLETE (2026-06-16) — 7 tests in validation.test.ts (2 RED)
- Step 4 Coding Agent: COMPLETE (2026-06-16) — json-error.ts created, app.ts updated
- Step 6 Test Execution: COMPLETE (2026-06-16) — 29/29 PASS
- Step 7 Integration Verification: COMPLETE (2026-06-16) — tsc --noEmit CLEAN
- Step 8 Code Reviewer: COMPLETE (2026-06-16) — APPROVED, 0 blocking issues
- Step 9 Documentation: COMPLETE (2026-06-16) — systemPatterns.md + techContext.md updated
- Step 10 Memory Bank: COMPLETE (2026-06-16) — tasks.md, TASK-004.md, progress.md updated

## Completed Work

- [x] [Level 1] JSON error handler middleware added (Completed: 2026-06-16)
  - Issue: Malformed JSON bodies returned empty `{}` 400 instead of `{ error: string }`
  - Solution: `jsonErrorHandler` ErrorRequestHandler catches SyntaxError from express.json(), returns structured 400
  - Files changed: `backend/src/middleware/json-error.ts` (new), `backend/src/app.ts` (modified), `backend/src/__tests__/validation.test.ts` (new)
  - Tests: 29/29 PASS (7 new)
