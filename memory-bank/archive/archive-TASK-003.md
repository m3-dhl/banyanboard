# Archive: Add CORS Configuration

## Metadata
- Task ID: TASK-003
- Complexity: Level 1
- Branch: task/003-add-cors-configuration
- Completed: 2026-06-09
- Reflection: `memory-bank/reflection/reflection-TASK-003.md`

## Summary

Added CORS middleware to the BanyanBoard Express backend. All allowed origins, methods, and headers are configurable via environment variables with safe production-ready defaults. Implemented TDD-first: test suite written before implementation; 22/22 tests pass with zero rework cycles.

## Solution

Installed the `cors` npm package and created a dedicated `backend/src/config/cors.ts` module with a pure `buildCorsOptions()` function. The function reads three environment variables and returns a typed `CorsOptions` object:

| Env Var | Default | Description |
|---------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `*` | Comma-separated origins or `*` |
| `CORS_ALLOWED_METHODS` | `GET,HEAD,PUT,PATCH,POST,DELETE` | Allowed HTTP methods |
| `CORS_ALLOWED_HEADERS` | `Content-Type,Authorization` | Allowed request headers |

The middleware is mounted as the first `app.use()` call in `app.ts`, before body parsers and routers, ensuring OPTIONS preflight requests are intercepted before any route logic runs.

Key design decision: when `CORS_ALLOWED_ORIGINS` is `'*'`, the function returns the literal string `'*'` (not `['*']`) because the `cors` package treats these differently — string `'*'` enables true wildcard mode.

## Files Changed

- `backend/src/config/cors.ts` — New: `buildCorsOptions()` pure function, env-var driven CORS options
- `backend/src/app.ts` — Modified: added `cors` import + mounted as first middleware (3 lines)
- `backend/src/__tests__/cors.test.ts` — New: 4 integration tests (simple cross-origin request + 3 preflight scenarios)
- `backend/package.json` — Modified: added `cors@^2.8.6` (dep) + `@types/cors@^2.8.19` (devDep)
- `backend/package-lock.json` — Updated

## Test Results

- **Total**: 22/22 PASS (18 pre-existing board/health tests + 4 new CORS tests)
- **Typecheck**: CLEAN (`tsc --noEmit`)
- **Build**: PASS (`tsc`)
- **Code Review**: APPROVED — 0 blocking issues

## Notes

- Default `CORS_ALLOWED_ORIGINS: '*'` is suitable for development but must be restricted before production deployment. This should be documented in the project ops runbook.
- No `CORS_ALLOW_CREDENTIALS` support intentionally omitted — `credentials: true` cannot be combined with `origin: '*'`; add in a follow-up if the frontend needs cookie/HTTP-auth support.
- The `config/cors.ts` file establishes a `config/` module convention in the backend that is not yet documented in `systemPatterns.md`.
