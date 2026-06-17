# Archive: TASK-011 — Fix cross-column card drop position

**Task ID**: TASK-011
**Complexity**: Level 1
**Status**: COMPLETE
**Completed**: 2026-06-17
**Branch**: hotfix/011-fix-cross-column-drop-position
**Commit**: 16550cd

## Summary

Fixed bug where cross-column card drops always placed the card last in the destination column, ignoring `destination.index`.

## Root Cause

`onDragEnd` cross-column logic used `prev.map(c => c.id === draggableId ? { ...c, columnId: dest } : c)`. This only updates `columnId` — the card keeps its original position in the flat `cards` array. Since cards from the same source column are grouped together, the moved card ended up after all existing destination-column cards.

## Fix

**File**: `frontend/src/components/Board.tsx` — `onDragEnd` cross-column section

Replace the `setCards` call with one that removes the card from the flat array and inserts it at `destination.index` within the target column:

```typescript
setCards((prev) => {
  const withoutMoved = prev.filter((c) => c.id !== draggableId)
  const updatedCard = { ...movedCard, columnId: destination.droppableId as ColumnId }
  const destCards = withoutMoved.filter((c) => c.columnId === destination.droppableId)
  const nonDestCards = withoutMoved.filter((c) => c.columnId !== destination.droppableId)
  const newDestCards = [
    ...destCards.slice(0, destination.index),
    updatedCard,
    ...destCards.slice(destination.index),
  ]
  return [...nonDestCards, ...newDestCards]
})
```

Also merged the previously separate `setCards` call into the `if (movedCard)` block (early return if card not found).

## Tests

3 new tests in `Board.test.tsx`:
- Drop at `destination.index=0` → card appears first in dest column
- Drop at `destination.index=1` → card appears after existing card
- Source column retains remaining cards after move

## Outcome

- 84/84 tests pass (81 existing + 3 new)
- Build clean
