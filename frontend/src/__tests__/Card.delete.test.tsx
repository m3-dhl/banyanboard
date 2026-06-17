import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import type { CardData } from '../types'

/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@hello-pangea/dnd', () => ({
  Draggable: ({ children }: any) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}))
/* eslint-enable @typescript-eslint/no-explicit-any */

// DeleteCardDialog uses createPortal — render into document.body normally in jsdom
import Card from '../components/Card'

const CARD: CardData = { id: 'card-1', title: 'Design login page', columnId: 'todo' }

function renderCard(onDelete = vi.fn()) {
  return render(
    <Card
      card={CARD}
      index={0}
      labels={[]}
      onLabelToggle={vi.fn()}
      onDelete={onDelete}
    />
  )
}

describe('Card — delete affordance', () => {
  it('renders Delete button with correct aria-label', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /delete design login page/i })).toBeInTheDocument()
  })

  it('clicking Delete opens DeleteCardDialog', () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /delete design login page/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
  })

  it('Cancel closes dialog and does not call onDelete', () => {
    const onDelete = vi.fn()
    renderCard(onDelete)
    fireEvent.click(screen.getByRole('button', { name: /delete design login page/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('Escape closes dialog and does not call onDelete', () => {
    const onDelete = vi.fn()
    renderCard(onDelete)
    fireEvent.click(screen.getByRole('button', { name: /delete design login page/i }))
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('"Delete permanently" calls onDelete with card id', () => {
    const onDelete = vi.fn()
    renderCard(onDelete)
    fireEvent.click(screen.getByRole('button', { name: /delete design login page/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }))
    expect(onDelete).toHaveBeenCalledWith('card-1')
  })
})
