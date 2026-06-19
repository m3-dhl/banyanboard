# Archive: TASK-014 — Multi-label filter selection

**Archived**: 2026-06-19
**Status**: COMPLETE
**Complexity**: Level 1
**Branch**: task/014-multi-label-filter-selection
**Commits**:
- `ab0b08d` feat(TASK-014): multi-label filter selection
- `2ad1237` fix(TASK-015): close label picker after selection
- `372d15e` fix(TASK-016): clamp label picker left position to prevent viewport overflow
- `b5f2d79` chore(TASK-014): add task reflection

## Summary

TASK-014 replaced BanyanBoard's single-label filter with a multi-select toggle model. Two related bugs were discovered and fixed on the same branch: TASK-015 (label picker popup never auto-closed after selection — pre-existing since TASK-008) and TASK-016 (label picker overflowed viewport in the DONE/rightmost column — no horizontal clamping).

**Final state**: 123 tests passing, build clean, lint clean.

## Changes Delivered

### TASK-014: Multi-label filter selection

| File | Change |
|------|--------|
| `frontend/src/components/FilterBar.tsx` | API rewrite: `activeFilter: string\|null` → `activeFilters: string[]`; each chip is a toggle (`aria-pressed`); `onFilterChange` + `onFilterClear` callbacks |
| `frontend/src/components/Board.tsx` | Filter state: `activeFilter` → `activeFilters: string[]`; inline toggle handler; OR-logic filter: `cards.filter(c => c.labels.some(l => activeFilters.includes(l.id)))` |
| `frontend/src/__tests__/Board.filter.test.tsx` | Full rewrite for new multi-select API: 15 FilterBar unit tests + 5 Board integration tests |

### TASK-015: Label picker auto-close

| File | Change |
|------|--------|
| `frontend/src/components/Card.tsx` | Added `setShowPicker(false)` to `handleLabelToggle` — picker now closes immediately after label selection |
| `frontend/src/__tests__/Board.feed.test.tsx` | Updated "label removed" test to re-open picker after first click (picker now closes after selection) |
| `frontend/src/__tests__/Board.reorder.test.tsx` | Removed redundant `Escape` keypress after picker selection |

### TASK-016: Label picker viewport overflow

| File | Change |
|------|--------|
| `frontend/src/components/LabelPickerPopover.tsx` | Added `POPOVER_MAX_WIDTH = 280` constant + `clampedLeft = Math.min(anchorRect.left, window.innerWidth - 280 - 8)` applied to both open-below and open-above positioning branches |
| `frontend/src/__tests__/Label.test.tsx` | 5 new positioning tests (overflow clamp, vertical flip, no-rect fallback) |
| `frontend/src/__tests__/Board.labels.test.tsx` | New file: 14 tests covering label toggle in all 3 columns (attach, detach, API error, multiple labels, filter interaction) |

## Test Results

| Stage | Count | Result |
|-------|-------|--------|
| After TASK-014 | 104/104 | PASS |
| After TASK-015 | 104/104 | PASS |
| After TASK-016 | 123/123 | PASS |
| Build | — | PASS |
| Lint | — | PASS |

## Key Technical Decisions

1. **`string[]` over `Set` for filter state** — cleaner React state, natural with `includes`/`filter`, no `new Set()` boilerplate. Label list is small — no performance concern.

2. **OR logic for multi-filter** — cards matching ANY selected label are shown. More intuitive than AND logic; maximizes result count.

3. **Inline toggle handler in Board** — four lines, single consumer. No need for `useFilterState` hook.

4. **`Math.min` clamp for horizontal positioning** — portals use fixed pixel coordinates from `getBoundingClientRect`; CSS parent constraints don't apply. `Math.min(anchorLeft, innerWidth - maxWidth - margin)` is the only correct approach.

## Reflection Reference

Full reflection: `memory-bank/reflection/reflection-TASK-014.md`

**Key learnings extracted:**
- `agent-rules/_learned/debugging-patterns.md` — check backend API health before assuming code regression
- `agent-rules/_learned/ui-positioning.md` — fixed-position portals need horizontal viewport clamping in both positioning branches
