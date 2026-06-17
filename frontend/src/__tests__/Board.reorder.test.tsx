import { render, screen, waitFor, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { DropResult } from '@hello-pangea/dnd'
import Board from '../components/Board'
import * as api from '../api'

// ---------------------------------------------------------------------------
// Custom SEED_CARDS: 2 cards in todo + 1 in done (enables same-column reorder tests)
// ---------------------------------------------------------------------------
vi.mock('../types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../types')>()
  return {
    ...actual,
    SEED_CARDS: [
      { id: 'card-1', title: 'First todo', columnId: 'todo' },
      { id: 'card-2', title: 'Second todo', columnId: 'todo' },
      { id: 'card-3', title: 'Done card', columnId: 'done' },
    ],
  }
})

// ---------------------------------------------------------------------------
// DnD mock — captures onDragEnd
// ---------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
let capturedOnDragEnd: ((result: DropResult) => void) | null = null

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => {
    capturedOnDragEnd = onDragEnd
    return <>{children}</>
  },
  Droppable: ({ children }: any) =>
    children(
      { innerRef: () => {}, droppableProps: {}, placeholder: null },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }: any) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}))
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// API mock
// ---------------------------------------------------------------------------
vi.mock('../api', () => ({
  fetchBoards: vi.fn(),
  fetchCards: vi.fn(),
  createCard: vi.fn(),
  fetchLabels: vi.fn(),
  createLabel: vi.fn(),
  deleteLabel: vi.fn(),
  attachLabel: vi.fn(),
  detachLabel: vi.fn(),
  reorderCard: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSameColDrop(draggableId: string, colId: string, fromIndex: number, toIndex: number): DropResult {
  return {
    draggableId,
    type: 'DEFAULT',
    source: { droppableId: colId, index: fromIndex },
    destination: { droppableId: colId, index: toIndex },
    reason: 'DROP',
    mode: 'FLUID',
    combine: null,
  }
}

function makeCrossColDrop(draggableId: string, fromCol: string, toCol: string): DropResult {
  return {
    draggableId,
    type: 'DEFAULT',
    source: { droppableId: fromCol, index: 0 },
    destination: { droppableId: toCol, index: 0 },
    reason: 'DROP',
    mode: 'FLUID',
    combine: null,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Board same-column card reordering', () => {
  beforeEach(() => {
    capturedOnDragEnd = null
    // clearAllMocks resets call history for vi.fn() mocks (restoreAllMocks only affects vi.spyOn)
    vi.clearAllMocks()
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    vi.mocked(api.fetchCards).mockResolvedValue([
      { id: 'card-1', title: 'First todo', columnId: 'todo' },
      { id: 'card-2', title: 'Second todo', columnId: 'todo' },
      { id: 'card-3', title: 'Done card', columnId: 'done' },
    ])
    vi.mocked(api.fetchLabels).mockResolvedValue([])
    vi.mocked(api.reorderCard).mockResolvedValue(undefined)
    vi.mocked(api.createCard).mockResolvedValue({ id: 'new', title: 'x', columnId: 'todo' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // AC-HAPPY-1: optimistic reorder reflected in DOM immediately
  it('reorders cards in DOM optimistically when dropped at a different index in same column', async () => {
    render(<Board />)

    const todoCol = screen.getByRole('region', { name: /todo/i })
    const before = within(todoCol).getAllByRole('article')
    expect(before[0]).toHaveAttribute('aria-label', 'First todo')
    expect(before[1]).toHaveAttribute('aria-label', 'Second todo')

    // Drop card-1 from index 0 to index 1 (move it after card-2)
    capturedOnDragEnd!(makeSameColDrop('card-1', 'todo', 0, 1))

    await waitFor(() => {
      const after = within(todoCol).getAllByRole('article')
      expect(after[0]).toHaveAttribute('aria-label', 'Second todo')
      expect(after[1]).toHaveAttribute('aria-label', 'First todo')
    })
  })

  // Same index → no state change, no API call
  it('does not reorder cards or call the API when dropped at the same index', async () => {
    render(<Board />)

    capturedOnDragEnd!(makeSameColDrop('card-1', 'todo', 0, 0))

    await waitFor(() => {
      const todoCol = screen.getByRole('region', { name: /todo/i })
      const cards = within(todoCol).getAllByRole('article')
      expect(cards[0]).toHaveAttribute('aria-label', 'First todo')
      expect(cards[1]).toHaveAttribute('aria-label', 'Second todo')
    })
    expect(api.reorderCard).not.toHaveBeenCalled()
  })

  // API called with correct card id and destination index
  it('calls reorderCard(cardId, destinationIndex) with correct arguments', async () => {
    render(<Board />)

    capturedOnDragEnd!(makeSameColDrop('card-1', 'todo', 0, 1))

    await waitFor(() => {
      expect(api.reorderCard).toHaveBeenCalledOnce()
      expect(api.reorderCard).toHaveBeenCalledWith('card-1', 1)
    })
  })

  // AC-ERROR-1: revert optimistic update on API failure
  // Note: optimistic update + revert happen within the same React flush cycle when
  // the rejected promise resolves in the next microtask; we verify the final
  // reverted state rather than the transient intermediate state.
  it('reverts card order to pre-drag state when reorderCard rejects', async () => {
    vi.mocked(api.reorderCard).mockRejectedValue(new Error('Network error'))
    render(<Board />)

    capturedOnDragEnd!(makeSameColDrop('card-1', 'todo', 0, 1))

    // After the rejected promise fires and state reverts, order must be restored
    await waitFor(() => {
      const todoCol = screen.getByRole('region', { name: /todo/i })
      const cards = within(todoCol).getAllByRole('article')
      expect(cards[0]).toHaveAttribute('aria-label', 'First todo')
      expect(cards[1]).toHaveAttribute('aria-label', 'Second todo')
    })

    // Error message shown to user after revert
    expect(screen.getByRole('alert')).toHaveTextContent(/failed to reorder card/i)
  })

  // AC-HAPPY-3: cross-column move must not trigger reorderCard
  it('does not call reorderCard for a cross-column drop (regression guard)', async () => {
    render(<Board />)

    capturedOnDragEnd!(makeCrossColDrop('card-1', 'todo', 'in-progress'))

    await waitFor(() => {
      const inProgressCol = screen.getByRole('region', { name: /in progress/i })
      expect(within(inProgressCol).getByRole('article')).toHaveAttribute('aria-label', 'First todo')
    })
    expect(api.reorderCard).not.toHaveBeenCalled()
  })

  // AC-ENTRY-2 (optional): after a same-column reorder, all original cards remain in the board
  // — verifies that no cards are accidentally dropped from state during the reorder operation
  it('preserves all cards (including other-column cards) after a same-column reorder', async () => {
    render(<Board />)

    // Reorder the two todo cards
    capturedOnDragEnd!(makeSameColDrop('card-1', 'todo', 0, 1))

    await waitFor(() => {
      // Todo column: reordered
      const todoCol = screen.getByRole('region', { name: /todo/i })
      const todoCards = within(todoCol).getAllByRole('article')
      expect(todoCards).toHaveLength(2)
      expect(todoCards[0]).toHaveAttribute('aria-label', 'Second todo')
      expect(todoCards[1]).toHaveAttribute('aria-label', 'First todo')

      // Done column: unchanged
      const doneCol = screen.getByRole('region', { name: /done/i })
      expect(within(doneCol).getByRole('article')).toHaveAttribute('aria-label', 'Done card')
    })
  })
})

// ---------------------------------------------------------------------------
// Filter + reorder integration (AC-ENTRY-2 with active filter)
// ---------------------------------------------------------------------------
describe('Board same-column reorder with active label filter (AC-ENTRY-2)', () => {
  beforeEach(() => {
    capturedOnDragEnd = null
    vi.clearAllMocks()
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    // Return a Bug label so the filter bar renders
    vi.mocked(api.fetchLabels).mockResolvedValue([
      { id: 'label-bug', name: 'Bug', color: '#C0392B' },
    ])
    vi.mocked(api.attachLabel).mockResolvedValue(undefined)
    vi.mocked(api.reorderCard).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not corrupt hidden cards when filter is active during a reorder', async () => {
    render(<Board />)

    // Wait for filter bar to appear (labels loaded)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
    })

    // Attach Bug label to card-1 via the label picker (optimistic update)
    const addLabelBtn = screen.getByRole('button', { name: /add label to first todo/i })
    await userEvent.click(addLabelBtn)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))
    // Close the picker
    await userEvent.keyboard('{Escape}')

    // Activate Bug filter — card-2 (no labels) becomes hidden
    // The filter bar chip has aria-pressed; the picker's chip does not
    const bugBtns = screen.getAllByRole('button', { name: /bug/i })
    const filterChip = bugBtns.find((btn) => btn.hasAttribute('aria-pressed'))
    if (!filterChip) throw new Error('Filter bar chip not found')
    await userEvent.click(filterChip)

    // card-2 no longer visible
    await waitFor(() => {
      expect(screen.queryByText('Second todo')).toBeNull()
    })

    // Simulate a same-column drop on card-1 (the only visible todo card)
    // destination.index = 0 = source.index → no-op, no API call
    capturedOnDragEnd!(makeSameColDrop('card-1', 'todo', 0, 0))

    // Clear the filter
    const clearBtn = screen.getByRole('button', { name: /clear filter/i })
    await userEvent.click(clearBtn)

    // card-2 must still be present after clearing filter (not dropped from state)
    // Use within(todoCol) to avoid matching activity-feed text that also contains card titles
    await waitFor(() => {
      const todoCol = screen.getByRole('region', { name: /todo/i })
      const todoCards = within(todoCol).getAllByRole('article')
      const labels = todoCards.map((c) => c.getAttribute('aria-label'))
      expect(labels).toContain('First todo')
      expect(labels).toContain('Second todo')
    })
  })
})
