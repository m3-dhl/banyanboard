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
const URGENT_LABEL: Label = { id: 'label-3', name: 'Urgent', color: '#E67E22' }

const SAMPLE_LABELS: Label[] = [BUG_LABEL, FEATURE_LABEL]

// ---------------------------------------------------------------------------
// FilterBar (isolated)
// ---------------------------------------------------------------------------

describe('FilterBar', () => {
  const defaultProps = {
    labels: SAMPLE_LABELS,
    activeFilters: [] as string[],
    onFilterChange: vi.fn(),
    onFilterClear: vi.fn(),
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

  it('marks active filter chips with aria-pressed="true"', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilters={['label-1']}
      />
    )
    expect(screen.getByRole('button', { name: /bug/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks non-active chips with aria-pressed="false"', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilters={['label-1']}
      />
    )
    expect(screen.getByRole('button', { name: /feature/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onFilterChange with the label id when the already-active chip is clicked (toggle off)', async () => {
    const onFilterChange = vi.fn()
    render(
      <FilterBar
        labels={SAMPLE_LABELS}
        activeFilters={['label-1']}
        onFilterChange={onFilterChange}
        onFilterClear={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /bug/i }))
    expect(onFilterChange).toHaveBeenCalledWith('label-1')
  })

  it('renders a "Clear filter" button when a filter is active', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilters={['label-1']}
      />
    )
    expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument()
  })

  it('does not render a "Clear filter" button when no filter is active', () => {
    render(<FilterBar {...defaultProps} activeFilters={[]} />)
    expect(screen.queryByRole('button', { name: /clear filter/i })).toBeNull()
  })

  it('calls onFilterClear when the "Clear filter" button is clicked', async () => {
    const onFilterClear = vi.fn()
    render(
      <FilterBar
        labels={SAMPLE_LABELS}
        activeFilters={['label-2']}
        onFilterChange={vi.fn()}
        onFilterClear={onFilterClear}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /clear filter/i }))
    expect(onFilterClear).toHaveBeenCalledOnce()
  })

  // Multi-select specific tests
  it('marks multiple chips as active when multiple filters are selected', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilters={['label-1', 'label-2']}
      />
    )
    expect(screen.getByRole('button', { name: /bug/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /feature/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders "Clear filter" button when multiple filters are active', () => {
    render(
      <FilterBar
        {...defaultProps}
        activeFilters={['label-1', 'label-2']}
      />
    )
    expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument()
  })

  it('can activate a second chip while one is already active', async () => {
    const onFilterChange = vi.fn()
    render(
      <FilterBar
        labels={SAMPLE_LABELS}
        activeFilters={['label-1']}
        onFilterChange={onFilterChange}
        onFilterClear={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /feature/i }))
    expect(onFilterChange).toHaveBeenCalledWith('label-2')
  })

  it('handles three labels and tracks all active states correctly', () => {
    render(
      <FilterBar
        labels={[BUG_LABEL, FEATURE_LABEL, URGENT_LABEL]}
        activeFilters={['label-1', 'label-3']}
        onFilterChange={vi.fn()}
        onFilterClear={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /bug/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /feature/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /urgent/i })).toHaveAttribute('aria-pressed', 'true')
  })
})

// ---------------------------------------------------------------------------
// Board — label filter integration
// ---------------------------------------------------------------------------

describe('Board label filtering', () => {
  beforeEach(() => {
    capturedOnDragEnd = null
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/cards') && !String(url).includes('/cards/')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'card-1', title: 'Design login page', columnId: 'todo', labels: [BUG_LABEL] },
            { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress', labels: [FEATURE_LABEL] },
            { id: 'card-3', title: 'Write README', columnId: 'done', labels: [] },
          ],
        } as unknown as Response)
      }
      if (String(url).includes('/labels')) {
        return Promise.resolve({
          ok: true,
          json: async () => [BUG_LABEL, FEATURE_LABEL],
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', title: 'BanyanBoard' }],
      } as unknown as Response)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hides cards that do not carry the active label when a filter is selected', async () => {
    render(<Board />)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })

    const bugChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    // card-1 has Bug label → visible; card-2 has Feature → hidden; card-3 has none → hidden
    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
      expect(screen.queryByText('Implement auth API')).toBeNull()
      expect(screen.queryByText('Write README')).toBeNull()
    })
  })

  it('shows all cards when the filter is cleared', async () => {
    render(<Board />)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })

    const bugChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    const clearButton = await screen.findByRole('button', { name: /clear filter/i })
    await userEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
      expect(screen.getByText('Implement auth API')).toBeInTheDocument()
      expect(screen.getByText('Write README')).toBeInTheDocument()
    })
  })

  it('shows cards matching ANY of the selected labels (OR logic)', async () => {
    render(<Board />)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })

    // Select Bug filter → only card-1 visible
    const bugChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
      expect(screen.queryByText('Implement auth API')).toBeNull()
    })

    // Also select Feature → card-1 and card-2 visible, card-3 still hidden
    const featureChip = screen.getByRole('button', { name: /feature/i })
    await userEvent.click(featureChip)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
      expect(screen.getByText('Implement auth API')).toBeInTheDocument()
      expect(screen.queryByText('Write README')).toBeNull()
    })
  })

  it('removes a single label from the active set when its chip is clicked again', async () => {
    render(<Board />)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })

    const bugChip = await screen.findByRole('button', { name: /bug/i })
    const featureChip = screen.getByRole('button', { name: /feature/i })

    // Activate both
    await userEvent.click(bugChip)
    await userEvent.click(featureChip)

    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
      expect(screen.getByText('Implement auth API')).toBeInTheDocument()
    })

    // Deactivate Bug — only Feature active now → only card-2 visible
    await userEvent.click(bugChip)

    await waitFor(() => {
      expect(screen.queryByText('Design login page')).toBeNull()
      expect(screen.getByText('Implement auth API')).toBeInTheDocument()
      expect(screen.queryByText('Write README')).toBeNull()
    })
  })

  // AC-ERROR-3: filter state preserved across drag-and-drop
  it('preserves active filters when a card is dragged to a different column', async () => {
    render(<Board />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
    })

    const bugChip = screen.getByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    await waitFor(() => {
      expect(screen.queryByText('Implement auth API')).toBeNull()
    })

    // Simulate a drag
    capturedOnDragEnd!(makeDropResult('card-2', 'in-progress', 'done'))

    // Filter must remain active
    await waitFor(() => {
      expect(screen.queryByText('Implement auth API')).toBeNull()
      expect(screen.getByRole('button', { name: /bug/i })).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
