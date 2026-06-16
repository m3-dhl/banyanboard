import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Board from '../components/Board'

/* eslint-disable @typescript-eslint/no-explicit-any */
let capturedOnDragEnd: ((result: any) => void) | null = null

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

describe('DnD - card movement', () => {
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

  it('moves card to target column on drop', () => {
    render(<Board />)

    const todoCol = screen.getByRole('region', { name: /todo/i })
    const doneCol = screen.getByRole('region', { name: /done/i })
    expect(todoCol).toHaveTextContent('Design login page')

    act(() => {
      capturedOnDragEnd!({
        draggableId: 'card-1',
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'done', index: 0 },
      })
    })

    expect(doneCol).toHaveTextContent('Design login page')
    expect(todoCol).not.toHaveTextContent('Design login page')
  })

  it('retains card title after move', () => {
    render(<Board />)

    act(() => {
      capturedOnDragEnd!({
        draggableId: 'card-1',
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'in-progress', index: 0 },
      })
    })

    const inProgressCol = screen.getByRole('region', { name: /in progress/i })
    expect(inProgressCol).toHaveTextContent('Design login page')
  })

  it('does not move card when destination is null', () => {
    render(<Board />)

    const todoCol = screen.getByRole('region', { name: /todo/i })

    act(() => {
      capturedOnDragEnd!({
        draggableId: 'card-1',
        source: { droppableId: 'todo', index: 0 },
        destination: null,
      })
    })

    expect(todoCol).toHaveTextContent('Design login page')
  })

  it('source column retains drop area after all cards moved out', () => {
    render(<Board />)

    act(() => {
      capturedOnDragEnd!({
        draggableId: 'card-1',
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'done', index: 0 },
      })
    })

    const todoCol = screen.getByRole('region', { name: /todo/i })
    expect(todoCol).toBeInTheDocument()
    expect(todoCol.querySelector('[data-testid="drop-area"]')).toBeInTheDocument()
    expect(todoCol).not.toHaveTextContent('Design login page')
  })
})
