# Archive: TASK-006 — Realtime Activity Feed

## Metadata

- **Task ID**: TASK-006
- **Complexity**: Level 2 (user-capped; natural eval = Level 3)
- **Roadmap Feature**: FEAT-005
- **Branch**: feature/FEAT-005-realtime-activity-feed
- **Merge Commit**: ca1ed51cfd0624a375eeea505d6240cb71af6037
- **Completed**: 2026-06-16
- **Reflection**: `memory-bank/reflection/reflection-TASK-006.md`

---

## Summary

Delivered a realtime activity feed for the BanyanBoard kanban application. Every cross-column card drag-and-drop event is captured synchronously in `Board.tsx`'s `onDragEnd` handler and prepended to an in-memory `feedEntries` state array. The feed renders as a persistent, always-visible section below the board columns — no toggle, no route change. 24/24 tests pass. All 9 acceptance criteria met.

---

## Solution

Two-phase implementation:

**Phase 1 — Component + Types** (`367cc6c`):
- Added `ActivityFeedEntry` interface to `frontend/src/types.ts` (`id`, `cardTitle`, `fromColumn: ColumnId`, `toColumn: ColumnId`, `timestamp: Date`)
- Built `ActivityFeed.tsx` — presentational component with `div[role="log"] > ul`, empty state "No activity yet.", 20-entry cap, `COLUMN_LABELS` resolution for display
- 6 Vitest unit tests in `ActivityFeed.test.tsx`

**Phase 2 — Board Integration** (`6ef310c`):
- Extended `onDragEnd` in `Board.tsx` to prepend `ActivityFeedEntry` on cross-column drops; same-column drops are no-ops
- Cap enforced: `slice(0, 20)` on each update
- `<ActivityFeed>` rendered unconditionally below `board-columns`
- 6 integration tests in `Board.feed.test.tsx`; existing `Board.test.tsx` and `DnD.test.tsx` queries narrowed to named landmark regions

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/types.ts` | Added `ActivityFeedEntry` interface |
| `frontend/src/components/ActivityFeed.tsx` | New — presentational feed component |
| `frontend/src/components/Board.tsx` | Added `feedEntries` state, extended `onDragEnd`, rendered `<ActivityFeed>` |
| `frontend/src/__tests__/ActivityFeed.test.tsx` | New — 6 unit tests |
| `frontend/src/__tests__/Board.feed.test.tsx` | New — 6 integration tests |
| `frontend/src/__tests__/Board.test.tsx` | Narrowed column region queries |
| `frontend/src/__tests__/DnD.test.tsx` | Narrowed card title assertion to column region |

---

## Key Technical Decisions

1. **Below-columns layout (Option A)** — Full-width `<section>` below board columns. No structural CSS changes, no sidebar wrapper. Appropriate for Level 2 scope.
2. **`timestamp: Date` (not `Date | string`)** — Reviewer narrowed the union. Eliminates a renderer branch; `toLocaleTimeString()` for display.
3. **`div[role="log"] + ul` ARIA** — Correct live-region pattern for an activity log. Plain `role="list"` on the `ul` was rejected in Phase 1 code review.
4. **Feed state in `Board.tsx`** — `useActivityFeed` hook considered and rejected as premature abstraction for a 20-line state pattern at MVP scale.

---

## Test Results

- **Phase 1**: 18/18 PASS
- **Phase 2**: 24/24 PASS
- Build: PASS (tsc + vite)
- Lint: PASS (eslint)

---

## Notes

- Feed is in-memory only — resets on page reload. Backend persistence is explicitly out of scope.
- `role="log"` defaults to `aria-live="polite"`. No `aria-atomic` was set; default behavior is correct. Auditable in future UAT cycle.
- The @hello-pangea/dnd mock pattern (captured `onDragEnd` closure + `act()`) is now the established pattern for DnD tests — see `memory-bank/agent-rules/_learned/testing-patterns.md`.
