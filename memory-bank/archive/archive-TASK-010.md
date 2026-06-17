# Archive: TASK-010 — Fix card drop animation

**Task ID**: TASK-010
**Complexity**: Level 1
**Status**: COMPLETE
**Completed**: 2026-06-17
**Branch**: hotfix/010-fix-card-drop-animation
**Commit**: 0c8e9ea

## Summary

Fixed visual glitch where reordered cards appeared to "fall from above" after being dropped in a same-column reorder.

## Root Cause

`.card` CSS class had `transition: box-shadow 150ms ease-out, transform 150ms ease-out`. When `@hello-pangea/dnd` sets/unsets inline `transform` on drop, the browser interpolated the transform from the dragged position back to 0, creating the fall animation. The library handles its own drop animation — the CSS transition was redundant and conflicting.

## Fix

**File**: `frontend/src/App.css` line 166

```css
/* Before */
transition: box-shadow 150ms ease-out, transform 150ms ease-out;

/* After */
transition: box-shadow 150ms ease-out;
```

## Outcome

- 81/81 tests pass
- Build clean
- No new tests added (CSS transitions untestable in jsdom)
