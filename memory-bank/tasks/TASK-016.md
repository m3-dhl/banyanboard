# TASK-016: Label picker overflows viewport in DONE column

**Complexity**: Level 1
**Status**: INITIALIZED
**Roadmap**: N/A
**Branch**: task/014-multi-label-filter-selection
**Worktree**: N/A (Level 1 uses direct branch, not worktree)

## Task Description

Label picker popover cannot be used in the DONE column (rightmost). When the popover opens, it positions itself with `left: anchorRect.left` and no horizontal clamping. On the rightmost column, the popover extends beyond the right edge of the viewport and label buttons are partially or fully off-screen/unreachable.

User reports: "el mismo error de antes, no permite insertar labels, está ocurriendo en DONE" — same issue in DONE column. Analiza todos los escenarios posibles.

## Root Cause

`LabelPickerPopover.tsx` computes position:
```tsx
positionStyle = { position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left }
```

No horizontal overflow guard. For DONE (rightmost column), `anchorRect.left` can be large enough that `left + min-width (200px)` exceeds `window.innerWidth`.

## Implementation Notes

Fix: clamp left position so popover stays within viewport:
```tsx
const POPOVER_MAX_WIDTH = 280 // matches CSS max-width
const clampedLeft = Math.min(anchorRect.left, window.innerWidth - POPOVER_MAX_WIDTH - 8)
```

Apply to both "open below" and "open above" (upward flip) variants.

Also: write comprehensive tests covering ALL scenarios per user request:
- Label toggle in all 3 columns (todo, in-progress, done)
- Picker opens and closes correctly in each column
- Horizontal overflow clamping (DONE column position simulation)
- Vertical overflow (near bottom of viewport — opens upward)
- Error handling when attachLabel API fails
- Error handling when detachLabel API fails
- With active label filter
- Multiple labels toggle

---

## Execution State

**Build Status**: RUNNING
**Current Build**: Phase 1: Fix label picker overflow (TASK-016)
**Build Started**: 2026-06-19
**Phase Number**: 1 of 1
**Is Multi-Phase**: NO

### Current Build Step
**Step**: Step 6 - Test Execution
**Status**: RUNNING
**Started**: 2026-06-19

### Completed Steps
(none)

### Sub-Agents
(none)

### Resumption Notes
**Can Resume**: YES
**Resume From**: Step 0.5 Git Setup
**Notes**: New build on task/014-multi-label-filter-selection branch
