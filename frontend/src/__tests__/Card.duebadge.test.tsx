import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
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

// Today = 2026-06-19
const TODAY = new Date('2026-06-19T10:00:00')

function renderCard(dueDate: string | null | undefined) {
  const card: CardData = {
    id: 'card-1',
    title: 'Design login page',
    columnId: 'todo',
    dueDate,
  }
  const { container } = render(
    <Card
      card={card}
      index={0}
      labels={[]}
      onLabelToggle={vi.fn()}
      onDelete={vi.fn()}
      onOpenDetail={vi.fn()}
    />
  )
  return container
}

describe('Card — due-date badge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders no badge when dueDate is null', () => {
    const container = renderCard(null)
    expect(container.querySelector('.due-date-badge')).toBeNull()
  })

  it('renders no badge when dueDate is undefined', () => {
    const container = renderCard(undefined)
    expect(container.querySelector('.due-date-badge')).toBeNull()
  })

  it('renders neutral badge when date is 5 days from today', () => {
    const container = renderCard('2026-06-24')
    expect(container.querySelector('.due-date-badge--neutral')).toBeInTheDocument()
    expect(container.querySelector('.due-date-badge--upcoming')).toBeNull()
    expect(container.querySelector('.due-date-badge--overdue')).toBeNull()
  })

  it('renders upcoming badge when date is exactly 3 days from today', () => {
    const container = renderCard('2026-06-22')
    expect(container.querySelector('.due-date-badge--upcoming')).toBeInTheDocument()
  })

  it('renders upcoming badge when date is 2 days from today', () => {
    const container = renderCard('2026-06-21')
    expect(container.querySelector('.due-date-badge--upcoming')).toBeInTheDocument()
  })

  it('renders upcoming badge when due date is today', () => {
    const container = renderCard('2026-06-19')
    expect(container.querySelector('.due-date-badge--upcoming')).toBeInTheDocument()
  })

  it('renders overdue badge when date is yesterday', () => {
    const container = renderCard('2026-06-18')
    expect(container.querySelector('.due-date-badge--overdue')).toBeInTheDocument()
    expect(container.querySelector('.due-date-badge--upcoming')).toBeNull()
  })

  it('overdue badge aria-label includes "overdue"', () => {
    const container = renderCard('2026-06-18')
    const badge = container.querySelector('.due-date-badge')
    expect(badge?.getAttribute('aria-label')).toMatch(/overdue/i)
  })

  it('badge text is human-readable month and day', () => {
    renderCard('2026-06-24')
    expect(screen.getByText(/jun/i)).toBeInTheDocument()
  })
})
