# Archive: Failed to create label bug fix

## Metadata
- **Task ID**: TASK-013
- **Complexity**: Level 1
- **Branch**: hotfix/013-failed-create-label
- **Completed**: 2026-06-19

## Summary

Label creation failed silently with "Failed to create label — please try again" in the Manage Labels UI. Root cause was a URL mismatch in `frontend/src/api.ts`: both `fetchLabels` and `createLabel` called `/boards/${boardId}/labels` — a nested route that does not exist on the backend. The backend mounts all label routes at the flat path `/labels`.

## Solution

Two API calls corrected in `api.ts`:

| Function | Before | After |
|----------|--------|-------|
| `fetchLabels` | `GET /boards/${boardId}/labels` | `GET /labels?boardId=${encodeURIComponent(boardId)}` |
| `createLabel` | `POST /boards/${boardId}/labels` | `POST /labels` + `boardId` in body |

Additionally, mock URL patterns in `Board.feed.test.tsx` were updated to match the corrected routes in the same commit, and a dedicated regression test file was added.

## Files Changed

- `frontend/src/api.ts` — corrected route paths + `encodeURIComponent` consistency
- `frontend/src/__tests__/api.label.test.ts` — new regression test (createLabel + fetchLabels)
- `frontend/src/__tests__/Board.feed.test.tsx` — updated mock URL pattern

## Test Results

- Backend: 72/72 PASS
- Frontend: 98/98 PASS
- Code review: APPROVED — 0 blocking issues, 0 security vulnerabilities

## Notes

- The bug was introduced when TASK-008 (Card Labels) was originally built — the frontend API client was written with a nested route assumption that was never validated against the actual backend mount point.
- The code reviewer caught an `encodeURIComponent` inconsistency (error message used raw `boardId` while the URL used the encoded form) — adopted before commit.
- Learned rules extracted: `api-design.md` (verify backend mount point before writing frontend call) and `testing-patterns.md` (update mock handlers in same commit as URL fix).

## Reflection

Full reflection: `memory-bank/reflection/reflection-TASK-013.md`
- Task Quality: Good
- Workflow Effectiveness: Highly Effective
