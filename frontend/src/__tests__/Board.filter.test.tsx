import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { DropResult } from '@hello-pangea/dnd'
import FilterBar from '../components/FilterBar'
import Board from '../components/Board'
import type { Label } from '../types'

// ---------------------------------------------------------------------------
// DnD mock — captures onDragEnd so tests can simulate drags
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

function makeDropResult(draggableId: string, fromCol: string, toCol: string): DropResult {
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
// Shared fixtures
// ---------------------------------------------------------------------------

const BUG_LABEL: Label = { id: 'label-1', name: 'Bug', color: '#C0392B' }
const FEATURE_LABEL: Label = { id: 'label-2', name: 'Feature', color: '#2980B9' }

const SAMPLE_LABELS: Label[] = [BUG_LABEL, FEATURE_LABEL]

// ---------------------------------------------------------------------------
// FilterBar (isolated)
// ---------------------------------------------------------------------------

describe('FilterBar', () => {
  const defaultProps = {
    labels: SAMPLE_LABELS,
    activeFilter: null,
    onFilterChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a chip for each label in the palette', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /feature/i })).toBeInTheDocument()
  })

  it('renders nothing (or no chips) when the label list is empty', () => {
    const { container } = render(
      <FilterBar {...defaultProps} labels={[]} />
    )
    // Either the component returns null or renders no interactive chips
    const chips = container.querySelectorAll('[role="button"], button')
    expect(chips).toHaveLength(0)
  })

  it('calls onFilterChange with the label id when a chip is clicked', async () => {
    const onFilterChange = vi.fn()
    render(<FilterBar {...defaultProps} onFilterChange={onFilterChange} />)
    await userEvent.click(screen.getByRole('button', { name: /bug/i }))
    expect(onFilterChange).toHaveBeenCalledOnce()
    expect(onFilterChange).toHaveBeenCalledWith('label-1')
  })

  it('marks the active filter chip with aria-pressed="true"', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilter="label-1"
      />
    )
    expect(screen.getByRole('button', { name: /bug/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks non-active chips with aria-pressed="false"', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilter="label-1"
      />
    )
    expect(screen.getByRole('button', { name: /feature/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onFilterChange with null when the already-active chip is clicked (toggle off)', async () => {
    const onFilterChange = vi.fn()
    render(
      <FilterBar
        labels={SAMPLE_LABELS}
        activeFilter="label-1"
        onFilterChange={onFilterChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /bug/i }))
    expect(onFilterChange).toHaveBeenCalledWith(null)
  })

  it('renders a "Clear filter" button when a filter is active', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilter="label-1"
      />
    )
    expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument()
  })

  it('does not render a "Clear filter" button when no filter is active', () => {
    render(<FilterBar {...defaultProps} activeFilter={null} />)
    expect(screen.queryByRole('button', { name: /clear filter/i })).toBeNull()
  })

  it('calls onFilterChange(null) when the "Clear filter" button is clicked', async () => {
    const onFilterChange = vi.fn()
    render(
      <FilterBar
        labels={SAMPLE_LABELS}
        activeFilter="label-2"
        onFilterChange={onFilterChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /clear filter/i }))
    expect(onFilterChange).toHaveBeenCalledWith(null)
  })
})

// ---------------------------------------------------------------------------
// Board — label filter integration
// ---------------------------------------------------------------------------

describe('Board label filtering', () => {
  beforeEach(() => {
    capturedOnDragEnd = null
    // Default fetch: board name + labels
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/labels')) {
        return Promise.resolve({
          ok: true,
          json: async () => [BUG_LABEL, FEATURE_LABEL],
        } as unknown as Response)
      }
      // Board name endpoint
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', name: 'BanyanBoard' }],
      } as unknown as Response)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hides cards that do not carry the active label when a filter is selected', async () => {
    render(<Board />)

    // Wait for Board to finish loading
    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })

    // The FilterBar should be rendered once labels have loaded.
    // Click the "Bug" chip to activate the filter.
    const bugChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    // Seed cards have no labels, so all seed cards should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Design login page')).toBeNull()
    })
  })

  it('shows all cards when the filter is cleared', async () => {
    render(<Board />)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })

    // Activate a filter
    const bugChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    // Then clear it
    const clearButton = await screen.findByRole('button', { name: /clear filter/i })
    await userEvent.click(clearButton)

    // All seed cards should be visible again
    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
      expect(screen.getByText('Implement auth API')).toBeInTheDocument()
      expect(screen.getByText('Write README')).toBeInTheDocument()
    })
  })

  // AC-ERROR-3: filter state preserved across drag-and-drop
  it('preserves active filter when a card is dragged to a different column', async () => {
    render(<Board />)

    // Wait for labels to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
    })

    // Activate Bug filter — all seed cards have no labels so all become hidden
    const bugChip = screen.getByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    await waitFor(() => {
      expect(screen.queryByText('Design login page')).toBeNull()
    })

    // Simulate a drag — "Design login page" (card-1) moves todo → in-progress
    capturedOnDragEnd!(makeDropResult('card-1', 'todo', 'in-progress'))

    // Filter must remain active: the card is still hidden (no Bug label)
    await waitFor(() => {
      expect(screen.queryByText('Design login page')).toBeNull()
      // Filter chip still shows active state
      expect(screen.getByRole('button', { name: /bug/i })).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
