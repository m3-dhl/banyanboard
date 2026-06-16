import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Column from '../components/Column'
import type { CardData } from '../types'

const cards: CardData[] = [
  { id: 'c1', title: 'Task Alpha', columnId: 'todo' },
  { id: 'c2', title: 'Task Beta', columnId: 'todo' },
]

describe('Column', () => {
  it('renders column label', () => {
    render(<Column id="todo" label="Todo" cards={[]} />)
    expect(screen.getByRole('heading', { name: /todo/i })).toBeInTheDocument()
  })

  it('renders all cards in the column', () => {
    render(<Column id="todo" label="Todo" cards={cards} />)
    expect(screen.getByText('Task Alpha')).toBeInTheDocument()
    expect(screen.getByText('Task Beta')).toBeInTheDocument()
  })

  it('renders empty state with visible drop area when no cards', () => {
    render(<Column id="todo" label="Todo" cards={[]} />)
    const region = screen.getByRole('region', { name: /todo/i })
    expect(region).toBeInTheDocument()
    // drop area present even when empty
    expect(region.querySelector('[data-testid="drop-area"]')).toBeInTheDocument()
  })
})
