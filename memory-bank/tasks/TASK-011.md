# TASK-011: Fix cross-column card drop position

**Complexity**: Level 1
**Status**: INITIALIZED
**Roadmap**: N/A
**Branch**: hotfix/011-fix-cross-column-drop-position
**Worktree**: N/A (Level 1 uses direct branch, not worktree)

## Task Description

When moving a card from one column to another, it always appears as the last element in the destination column regardless of where the user drops it.

## Root Cause

`onDragEnd` cross-column logic uses `prev.map(c => c.id === draggableId ? { ...c, columnId: dest } : c)`. This only updates `columnId` — the card stays at its original flat-array position. Since cards from the same source column are grouped together in the array, the moved card ends up after all existing destination-column cards (last).

## Fix

Replace the `setCards` cross-column call with one that:
1. Removes the dragged card from the flat array
2. Inserts it at `destination.index` within the destination column's cards
3. Reconstructs flat array as `[...nonDestCards, ...newDestCards]`

File: `frontend/src/components/Board.tsx` — `onDragEnd` function.

---

## Execution State

**Build Status**: IDLE
**Current Phase**: INITIALIZED → BUILD
**Can Resume**: NO

### Active Sub-Agents
(none)

### Completed Steps
(none)
