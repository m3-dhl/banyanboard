import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ActivityFeed from '../components/ActivityFeed'
import type { ActivityFeedEntry } from '../types'

// Helper: create a minimal valid entry
function makeEntry(
  overrides: Partial<ActivityFeedEntry> & { id: string }
): ActivityFeedEntry {
  return {
    cardTitle: 'Test Card',
    fromColumn: 'todo',
    toColumn: 'in-progress',
    timestamp: new Date('2026-06-16T10:00:00.000Z'),
    ...overrides,
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
    // heading must be present unconditionally (no toggle needed)
    expect(
      screen.getByRole('heading', { name: /activity/i })
    ).toBeInTheDocument()
  })

  // AC-ENTRY-1: list of entries is rendered when provided
  it('renders one list item per entry when entries are provided', () => {
    const entries: ActivityFeedEntry[] = [
      makeEntry({ id: 'e1', cardTitle: 'Alpha Card' }),
      makeEntry({ id: 'e2', cardTitle: 'Beta Card' }),
    ]
    render(<ActivityFeed entries={entries} />)

    // empty state must NOT appear
    expect(screen.queryByText('No activity yet.')).toBeNull()
    // both card titles are present
    expect(screen.getByText('Alpha Card')).toBeInTheDocument()
    expect(screen.getByText('Beta Card')).toBeInTheDocument()
  })

  // AC-ENTRY-1: each entry shows cardTitle, resolved column labels, and a timestamp element
  it('displays card title, source and destination column labels, and a timestamp for each entry', () => {
    const entries: ActivityFeedEntry[] = [
      makeEntry({
        id: 'e1',
        cardTitle: 'My Task',
        fromColumn: 'todo',
        toColumn: 'in-progress',
        timestamp: new Date('2026-06-16T12:30:00.000Z'),
      }),
    ]
    render(<ActivityFeed entries={entries} />)

    // card title
    expect(screen.getByText('My Task')).toBeInTheDocument()
    // resolved column labels (from COLUMNS constant: 'todo' → 'Todo', 'in-progress' → 'In Progress')
    expect(screen.getByText(/Todo/)).toBeInTheDocument()
    expect(screen.getByText(/In Progress/)).toBeInTheDocument()
    // a time element (or any element) carrying the timestamp value is present
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  // Phase spec requirement: component must never render more than 20 entries
  it('renders at most 20 entries when given 21 entries', () => {
    const entries: ActivityFeedEntry[] = Array.from({ length: 21 }, (_, i) =>
      makeEntry({ id: `e${i}`, cardTitle: `Card ${i}` })
    )
    render(<ActivityFeed entries={entries} />)

    // find all rendered entry items; the component should cap display at 20
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeLessThanOrEqual(20)
  })

  // WCAG: feed region must be accessible as a log or list
  it('wraps the feed in a region with role="log" or role="list" for screen-reader accessibility', () => {
    render(<ActivityFeed entries={[makeEntry({ id: 'e1' })]} />)

    // Either role="log" (live region for activity) or role="list" (explicit list) is acceptable
    const logRegion = document.querySelector('[role="log"]')
    const listRegion = document.querySelector('[role="list"]')
    expect(logRegion ?? listRegion).not.toBeNull()
  })
})
