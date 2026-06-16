import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import Column from '../components/Column'
import type { CardData } from '../types'

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

const cards: CardData[] = [
  { id: 'c1', title: 'Task Alpha', columnId: 'todo' },
  { id: 'c2', title: 'Task Beta', columnId: 'todo' },
]

describe('Column', () => {
  it('renders column label', () => {
    render(<Column id="todo" label="Todo" cards={[]} onAddCard={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /todo/i })).toBeInTheDocument()
  })

  it('renders all cards in the column', () => {
    render(<Column id="todo" label="Todo" cards={cards} onAddCard={vi.fn()} />)
    const col = screen.getByRole('region', { name: /todo/i })
    expect(col).toHaveTextContent('Task Alpha')
    expect(col).toHaveTextContent('Task Beta')
  })

  it('renders empty state with visible drop area when no cards', () => {
    render(<Column id="todo" label="Todo" cards={[]} onAddCard={vi.fn()} />)
    const region = screen.getByRole('region', { name: /todo/i })
    expect(region).toBeInTheDocument()
    expect(region.querySelector('[data-testid="drop-area"]')).toBeInTheDocument()
  })

  // AC-ENTRY-1: "Add card" button always visible at column bottom
  it('renders an "Add card" button regardless of how many cards exist', () => {
    render(<Column id="todo" label="Todo" cards={[]} onAddCard={vi.fn()} />)
    const col = screen.getByRole('region', { name: /todo/i })
    expect(col.querySelector('button[data-action="add-card"]') ??
      screen.queryByRole('button', { name: /add card/i })).toBeTruthy()
  })

  it('renders "Add card" button even when column has multiple cards', () => {
    render(<Column id="todo" label="Todo" cards={cards} onAddCard={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument()
  })

  // AC-HAPPY-1: clicking "Add card" opens inline form and hides the button
  it('opens inline form when "Add card" is clicked; hides the "Add card" button', () => {
    render(<Column id="todo" label="Todo" cards={[]} onAddCard={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /add card/i }))
    expect(screen.getByRole('textbox', { name: /card title/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add card/i })).not.toBeInTheDocument()
  })

  // AC-HAPPY-2: Cancel collapses form, restores "Add card" button, no card added
  it('collapses form and restores "Add card" button on Cancel; does not call onAddCard', () => {
    const onAddCard = vi.fn()
    render(<Column id="todo" label="Todo" cards={[]} onAddCard={onAddCard} />)
    fireEvent.click(screen.getByRole('button', { name: /add card/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /card title/i })).not.toBeInTheDocument()
    expect(onAddCard).not.toHaveBeenCalled()
  })

  // AC-HAPPY-1: valid submit calls onAddCard with columnId and title, collapses form
  it('calls onAddCard with columnId and title on valid submit; collapses form', () => {
    const onAddCard = vi.fn()
    render(<Column id="todo" label="Todo" cards={[]} onAddCard={onAddCard} />)
    fireEvent.click(screen.getByRole('button', { name: /add card/i }))
    fireEvent.change(screen.getByRole('textbox', { name: /card title/i }), {
      target: { value: 'My new task' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAddCard).toHaveBeenCalledWith('todo', 'My new task')
    expect(screen.queryByRole('textbox', { name: /card title/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument()
  })
})
