import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import FilterBar from '../components/FilterBar'
import Board from '../components/Board'
import type { Label } from '../types'

// ---------------------------------------------------------------------------
// DnD mock — required for any test that renders Board
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <>{children}</>,
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
    // Default fetch: board name + empty labels list + seed cards implied by Board state
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
})
