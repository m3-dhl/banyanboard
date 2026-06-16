import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ActivityFeed from '../components/ActivityFeed'
import type { ActivityFeedEntry } from '../types'

function makeMoveEntry(id: string, overrides: Partial<{ cardTitle: string; fromColumn: 'todo' | 'in-progress' | 'done'; toColumn: 'todo' | 'in-progress' | 'done'; timestamp: Date }> = {}): ActivityFeedEntry {
  return {
    id,
    kind: 'move',
    cardTitle: overrides.cardTitle ?? 'Test Card',
    fromColumn: overrides.fromColumn ?? 'todo',
    toColumn: overrides.toColumn ?? 'in-progress',
    timestamp: overrides.timestamp ?? new Date('2026-06-16T10:00:00.000Z'),
  }
}

function makeCreatedEntry(id: string, overrides: Partial<{ cardTitle: string; columnId: 'todo' | 'in-progress' | 'done'; timestamp: Date }> = {}): ActivityFeedEntry {
  return {
    id,
    kind: 'created',
    cardTitle: overrides.cardTitle ?? 'Test Card',
    columnId: overrides.columnId ?? 'todo',
    timestamp: overrides.timestamp ?? new Date('2026-06-16T10:00:00.000Z'),
  }
}

describe('ActivityFeed', () => {
  // AC-ENTRY-1 / AC-ERROR-2
  it('renders empty state "No activity yet." when entries is empty', () => {
    render(<ActivityFeed entries={[]} />)
    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
  })

  // AC-ENTRY-1: feed section always visible with a heading label
  it('renders a visible "Activity" heading without any interaction required', () => {
    render(<ActivityFeed entries={[]} />)
    expect(
      screen.getByRole('heading', { name: /activity/i })
    ).toBeInTheDocument()
  })

  // AC-ENTRY-1: list of entries is rendered when provided
  it('renders one list item per entry when entries are provided', () => {
    const entries: ActivityFeedEntry[] = [
      makeMoveEntry('e1', { cardTitle: 'Alpha Card' }),
      makeMoveEntry('e2', { cardTitle: 'Beta Card' }),
    ]
    render(<ActivityFeed entries={entries} />)
    expect(screen.queryByText('No activity yet.')).toBeNull()
    expect(screen.getByText('Alpha Card')).toBeInTheDocument()
    expect(screen.getByText('Beta Card')).toBeInTheDocument()
  })

  // AC-ENTRY-1: move entry shows from/to column labels and timestamp
  it('displays card title, source and destination column labels, and a timestamp for move entries', () => {
    const entries: ActivityFeedEntry[] = [
      makeMoveEntry('e1', {
        cardTitle: 'My Task',
        fromColumn: 'todo',
        toColumn: 'in-progress',
        timestamp: new Date('2026-06-16T12:30:00.000Z'),
      }),
    ]
    render(<ActivityFeed entries={entries} />)
    expect(screen.getByText('My Task')).toBeInTheDocument()
    expect(screen.getByText(/Todo/)).toBeInTheDocument()
    expect(screen.getByText(/In Progress/)).toBeInTheDocument()
    const timeEl = document.querySelector('time[datetime*="2026"]')
    expect(timeEl).not.toBeNull()
  })

  // AC-ASYNC-1: creation entry shows "created in [column label]"
  it('displays "created in [column label]" for creation events', () => {
    const entries: ActivityFeedEntry[] = [
      makeCreatedEntry('e1', { cardTitle: 'New Feature', columnId: 'todo' }),
    ]
    render(<ActivityFeed entries={entries} />)
    expect(screen.getByText('New Feature')).toBeInTheDocument()
    expect(screen.getByText(/created in/i)).toBeInTheDocument()
    expect(screen.getByText(/Todo/)).toBeInTheDocument()
  })

  // Phase spec requirement: component must never render more than 20 entries
  it('renders at most 20 entries when given 21 entries', () => {
    const entries: ActivityFeedEntry[] = Array.from({ length: 21 }, (_, i) =>
      makeMoveEntry(`e${i}`, { cardTitle: `Card ${i}` })
    )
    render(<ActivityFeed entries={entries} />)
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeLessThanOrEqual(20)
  })

  // WCAG: feed region must be accessible as a log or list
  it('wraps the feed in a region with role="log" or role="list" for screen-reader accessibility', () => {
    render(<ActivityFeed entries={[makeMoveEntry('e1')]} />)
    const logRegion = document.querySelector('[role="log"]')
    const listRegion = document.querySelector('[role="list"]')
    expect(logRegion ?? listRegion).not.toBeNull()
  })
})
