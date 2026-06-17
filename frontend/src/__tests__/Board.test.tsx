import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Board from '../components/Board'

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
