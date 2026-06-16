# Archive: Add JSON Error Handler Middleware for Malformed Request Bodies

## Metadata
- Task ID: TASK-004
- Complexity: Level 1
- Completed: 2026-06-16
- Branch: task/004-add-input-validation-middleware
- Commit: 0b90450

## Summary

Added `jsonErrorHandler` middleware to catch `SyntaxError` thrown by `express.json()` when the request body is malformed JSON. Previously, malformed JSON returned an empty `{}` 400 response with no message; now returns a structured `{ error: string }` 400 consistent with the project's error format.

## Solution

Created a new `ErrorRequestHandler` middleware (`backend/src/middleware/json-error.ts`) that checks `instanceof SyntaxError` on the error and the presence of `body` on the request. Mounted as the first `app.use()` after `express.json()` in `app.ts` to intercept parse errors before any route handler runs. Followed the existing `ValidationError` catch pattern already established in board controllers.

## Files Changed

- `backend/src/middleware/json-error.ts` — new file: `jsonErrorHandler` ErrorRequestHandler
- `backend/src/app.ts` — import and mount `jsonErrorHandler` after body-parser
- `backend/src/__tests__/validation.test.ts` — new file: 7 tests covering malformed JSON 400, missing required fields 400, valid requests 200/201

## Test Results

29/29 PASS (7 new tests added). TypeScript compile clean (`tsc --noEmit`). Code reviewer approved, 0 blocking issues.

## Notes

- Error handler is mounted *after* `express.json()` but *before* any router — order matters for Express error middleware.
- Pattern applies to all routes automatically; no per-route wiring needed.
- Required fields validation (title on POST /boards) was already handled by `ValidationError` in `board.service.ts`; the middleware only adds the malformed-JSON case.
