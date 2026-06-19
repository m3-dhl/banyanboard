# TASK-015: Fix broken label-add after TASK-014

**Complexity**: Level 1
**Status**: INITIALIZED
**Roadmap**: N/A
**Branch**: hotfix/015-fix-label-add-after-multi-filter
**Worktree**: N/A (Level 1 uses direct branch, not worktree)

## Task Description

Tras la refactorización del filtro de labels (TASK-014), se ha roto la funcionalidad de añadir labels a cards. Investigar la causa y corregir.

## Implementation Notes

TASK-014 changes:
- `FilterBar.tsx`: `activeFilter: string|null` → `activeFilters: string[]` + `onFilterClear`
- `Board.tsx`: filter state array, toggle handler, OR-logic filtering

Possible root causes to investigate:
- `onLabelToggle` closure sees stale state
- `filteredCards` used where `cards` should be
- Event propagation from LabelPickerPopover portal to FilterBar
- TypeScript prop mismatch causing silent runtime failure

Static analysis inconclusive — needs runtime investigation.

---

## Execution State

**Build Status**: IDLE
**Current Phase**: INITIALIZED
**Can Resume**: NO

### Active Sub-Agents
(none)

### Completed Steps
(none)
