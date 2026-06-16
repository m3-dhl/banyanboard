import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

describe('Board feed integration', () => {
  beforeEach(() => {
    capturedOnDragEnd = null
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1', name: 'BanyanBoard' }],
    } as unknown as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders ActivityFeed with empty state on initial load', () => {
    render(<Board />)
    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
  })

  it('adds feed entry when card moves to a different column', async () => {
    render(<Board />)
    capturedOnDragEnd!(makeDropResult('card-1', 'todo', 'in-progress'))
    await waitFor(() => {
      expect(screen.getByRole('listitem')).toBeInTheDocument()
      expect(screen.getByRole('listitem')).toHaveTextContent('Design login page')
    })
    expect(screen.queryByText('No activity yet.')).not.toBeInTheDocument()
  })

  it('does not add feed entry when card dropped on same column', async () => {
    render(<Board />)
    capturedOnDragEnd!(makeDropResult('card-1', 'todo', 'todo'))
    await waitFor(() => {
      expect(screen.getByText('No activity yet.')).toBeInTheDocument()
    })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('accumulates entries in reverse-chronological order', async () => {
    render(<Board />)
    capturedOnDragEnd!(makeDropResult('card-1', 'todo', 'in-progress'))
    capturedOnDragEnd!(makeDropResult('card-2', 'in-progress', 'done'))
    await waitFor(() => {
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent('Implement auth API')
      expect(items[1]).toHaveTextContent('Design login page')
    })
  })

  it('caps feed at 20 entries and discards oldest when cap exceeded', async () => {
    render(<Board />)
    for (let i = 0; i < 21; i++) {
      const from = i % 2 === 0 ? 'todo' : 'in-progress'
      const to = i % 2 === 0 ? 'in-progress' : 'todo'
      capturedOnDragEnd!(makeDropResult('card-1', from, to))
    }
    await waitFor(() => {
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(20)
    })
  })

  // AC-ASYNC-1: card creation appends a "created in" entry to the feed
  it('adds a "created in" feed entry when a card is created via the inline form', async () => {
    render(<Board />)
    const todoCol = screen.getByRole('region', { name: /todo/i })
    fireEvent.click(todoCol.querySelector('button')!)  // "Add card" button
    fireEvent.change(screen.getByRole('textbox', { name: /card title/i }), {
      target: { value: 'Brand new task' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    await waitFor(() => {
      expect(screen.getByRole('listitem')).toHaveTextContent('Brand new task')
      expect(screen.getByRole('listitem')).toHaveTextContent(/created in/i)
    })
  })

  // AC-ERROR-2: rollback on backend failure
  it('rolls back card and feed entry and shows error when POST /cards fails', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init && init.method === 'POST') {
        return Promise.resolve({ ok: false, status: 500 } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', title: 'BanyanBoard' }],
      } as unknown as Response)
    })
    render(<Board />)
    const todoCol = screen.getByRole('region', { name: /todo/i })
    fireEvent.click(todoCol.querySelector('button')!)
    fireEvent.change(screen.getByRole('textbox', { name: /card title/i }), {
      target: { value: 'Rollback card' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to save card/i)
    })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('feed entries survive unrelated re-renders caused by board name update', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1', title: 'Sprint Board' }],
    } as unknown as Response)
    render(<Board />)
    capturedOnDragEnd!(makeDropResult('card-1', 'todo', 'in-progress'))
    await waitFor(() => {
      expect(screen.getByRole('listitem')).toHaveTextContent('Design login page')
    })
    // API resolves and triggers unrelated boardName re-render
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sprint Board')
    })
    // Feed entry must survive the unrelated state update
    expect(screen.getByRole('listitem')).toHaveTextContent('Design login page')
  })
})
