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

import Card from '../components/Card'

const CARD: CardData = { id: 'card-1', title: 'Design login page', columnId: 'todo' }

function renderCard(onOpenDetail = vi.fn(), card = CARD) {
  return render(
    <Card
      card={card}
      index={0}
      labels={[]}
      onLabelToggle={vi.fn()}
      onDelete={vi.fn()}
      onOpenDetail={onOpenDetail}
    />
  )
}

describe('Card — click-vs-drag disambiguation', () => {
  it('genuine pointer click (< 5px) calls onOpenDetail with card id', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const cardEl = screen.getByRole('article')
    fireEvent.pointerDown(cardEl, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(cardEl, { clientX: 102, clientY: 101 })
    expect(onOpenDetail).toHaveBeenCalledWith('card-1')
  })

  it('pointer move >= 5px does not call onOpenDetail', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const cardEl = screen.getByRole('article')
    fireEvent.pointerDown(cardEl, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(cardEl, { clientX: 115, clientY: 100 })
    expect(onOpenDetail).not.toHaveBeenCalled()
  })

  it('diagonal drag >= 5px does not call onOpenDetail', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const cardEl = screen.getByRole('article')
    fireEvent.pointerDown(cardEl, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(cardEl, { clientX: 104, clientY: 104 })
    expect(onOpenDetail).not.toHaveBeenCalled()
  })

  it('Enter key calls onOpenDetail', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const cardEl = screen.getByRole('article')
    fireEvent.keyDown(cardEl, { key: 'Enter' })
    expect(onOpenDetail).toHaveBeenCalledWith('card-1')
  })

  it('Space key calls onOpenDetail', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const cardEl = screen.getByRole('article')
    fireEvent.keyDown(cardEl, { key: ' ' })
    expect(onOpenDetail).toHaveBeenCalledWith('card-1')
  })

  it('clicking Delete button does not call onOpenDetail', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const deleteBtn = screen.getByRole('button', { name: /delete design login page/i })
    fireEvent.pointerDown(deleteBtn, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(deleteBtn, { clientX: 101, clientY: 100 })
    expect(onOpenDetail).not.toHaveBeenCalled()
  })

  it('clicking Add Label button does not call onOpenDetail', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const addBtn = screen.getByRole('button', { name: /add label to design login page/i })
    fireEvent.pointerDown(addBtn, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(addBtn, { clientX: 100, clientY: 100 })
    expect(onOpenDetail).not.toHaveBeenCalled()
  })

  it('pointerUp without preceding pointerDown does nothing', () => {
    const onOpenDetail = vi.fn()
    renderCard(onOpenDetail)
    const cardEl = screen.getByRole('article')
    fireEvent.pointerUp(cardEl, { clientX: 100, clientY: 100 })
    expect(onOpenDetail).not.toHaveBeenCalled()
  })
})
