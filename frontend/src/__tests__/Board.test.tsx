import { render, screen, waitFor, within, act, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { DropResult } from '@hello-pangea/dnd'
import Board from '../components/Board'

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

function makeCrossColDrop(
  draggableId: string,
  fromCol: string,
  fromIndex: number,
  toCol: string,
  toIndex: number
): DropResult {
  return {
    draggableId,
    type: 'DEFAULT',
    source: { droppableId: fromCol, index: fromIndex },
    destination: { droppableId: toCol, index: toIndex },
    reason: 'DROP',
    mode: 'FLUID',
    combine: null,
  }
}

describe('Board', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/cards')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'card-1', title: 'Design login page', columnId: 'todo' },
            { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress' },
            { id: 'card-3', title: 'Write README', columnId: 'done' },
          ],
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

  it('renders exactly 3 columns in left-to-right order', async () => {
    render(<Board />)
    const columns = screen.getAllByRole('region', { name: /^(todo|in progress|done)$/i })
    expect(columns).toHaveLength(3)
    expect(columns[0]).toHaveTextContent('Todo')
    expect(columns[1]).toHaveTextContent('In Progress')
    expect(columns[2]).toHaveTextContent('Done')
  })

  it('renders seed cards in their correct columns', async () => {
    render(<Board />)
    const todoCol = screen.getByRole('region', { name: /todo/i })
    const inProgressCol = screen.getByRole('region', { name: /in progress/i })
    const doneCol = screen.getByRole('region', { name: /done/i })

    expect(todoCol).toHaveTextContent('Design login page')
    expect(inProgressCol).toHaveTextContent('Implement auth API')
    expect(doneCol).toHaveTextContent('Write README')
  })

  it('displays board name from API in header', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByText(/banyanboard/i)).toBeInTheDocument()
    })
  })

  it('renders board with seed cards when backend is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByText('Design login page')).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows API error indicator when backend returns error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response)
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})

describe('Board — onDeleteCard', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/cards')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'card-1', title: 'Design login page', columnId: 'todo' },
            { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress' },
            { id: 'card-3', title: 'Write README', columnId: 'done' },
          ],
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

  it('optimistically removes card and adds deleted feed entry on confirm', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (String(url).includes('/cards') && opts?.method === 'DELETE') {
        return Promise.resolve({ ok: true } as unknown as Response)
      }
      if (String(url).includes('/cards')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'card-1', title: 'Design login page', columnId: 'todo' }],
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', title: 'BanyanBoard' }],
      } as unknown as Response)
    })

    render(<Board />)
    await waitFor(() => expect(screen.getByText('Design login page')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /delete design login page/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }))

    await waitFor(() => {
      expect(screen.queryByRole('article', { name: 'Design login page' })).toBeNull()
    })
    expect(screen.getByText(/deleted/i)).toBeInTheDocument()
  })

  it('reverts optimistic delete and shows error banner when API fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (String(url).includes('/cards') && opts?.method === 'DELETE') {
        return Promise.resolve({ ok: false, status: 500 } as unknown as Response)
      }
      if (String(url).includes('/cards')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'card-1', title: 'Design login page', columnId: 'todo' }],
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', title: 'BanyanBoard' }],
      } as unknown as Response)
    })

    render(<Board />)
    await waitFor(() => expect(screen.getByText('Design login page')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /delete design login page/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert', { name: '' })).toHaveTextContent(
        /failed to delete card/i
      )
    })
  })
})

describe('Board cross-column drop position', () => {
  // Setup: 2 cards in todo, 1 in done — gives us a non-trivial destination column
  const CARDS_JSON = [
    { id: 'card-1', title: 'Card One', columnId: 'todo' },
    { id: 'card-2', title: 'Card Two', columnId: 'todo' },
    { id: 'card-3', title: 'Card Three', columnId: 'done' },
  ]

  beforeEach(() => {
    capturedOnDragEnd = null
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/cards')) {
        return Promise.resolve({ ok: true, json: async () => CARDS_JSON } as unknown as Response)
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

  it('inserts card at destination.index=0 (top of column)', async () => {
    render(<Board />)
    // Wait for cards to render
    await waitFor(() => expect(screen.getByText('Card One')).toBeInTheDocument())

    act(() => {
      capturedOnDragEnd!(makeCrossColDrop('card-1', 'todo', 0, 'done', 0))
    })

    await waitFor(() => {
      const doneCol = screen.getByRole('region', { name: /done/i })
      const articles = within(doneCol).getAllByRole('article')
      // card-1 should be at index 0, card-3 at index 1
      expect(articles[0]).toHaveAttribute('aria-label', 'Card One')
      expect(articles[1]).toHaveAttribute('aria-label', 'Card Three')
    })
  })

  it('inserts card at destination.index=1 (after existing card)', async () => {
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Card One')).toBeInTheDocument())

    act(() => {
      capturedOnDragEnd!(makeCrossColDrop('card-1', 'todo', 0, 'done', 1))
    })

    await waitFor(() => {
      const doneCol = screen.getByRole('region', { name: /done/i })
      const articles = within(doneCol).getAllByRole('article')
      // card-3 at index 0, card-1 at index 1
      expect(articles[0]).toHaveAttribute('aria-label', 'Card Three')
      expect(articles[1]).toHaveAttribute('aria-label', 'Card One')
    })
  })

  it('source column retains remaining cards after cross-column move', async () => {
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Card One')).toBeInTheDocument())

    act(() => {
      capturedOnDragEnd!(makeCrossColDrop('card-1', 'todo', 0, 'done', 0))
    })

    await waitFor(() => {
      const todoCol = screen.getByRole('region', { name: /todo/i })
      const articles = within(todoCol).getAllByRole('article')
      expect(articles).toHaveLength(1)
      expect(articles[0]).toHaveAttribute('aria-label', 'Card Two')
    })
  })
})
