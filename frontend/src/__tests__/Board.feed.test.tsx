import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { DropResult } from '@hello-pangea/dnd'
import type { Label } from '../types'
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

const SEED_CARDS_JSON = [
  { id: 'card-1', title: 'Design login page', columnId: 'todo' },
  { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress' },
  { id: 'card-3', title: 'Write README', columnId: 'done' },
]

function makeDefaultFetch(boardName = 'BanyanBoard', labels: unknown[] = []) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (String(url).includes('/cards') && !String(url).includes('/cards/')) {
      return Promise.resolve({ ok: true, json: async () => SEED_CARDS_JSON } as unknown as Response)
    }
    if (String(url).includes('/boards/') && String(url).includes('/labels')) {
      return Promise.resolve({ ok: true, json: async () => labels } as unknown as Response)
    }
    if (String(url).includes('/cards/') && String(url).includes('/labels')) {
      return Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response)
    }
    if (init && init.method === 'POST') {
      return Promise.resolve({ ok: true, json: async () => ({ id: 'new', title: 'x', columnId: 'todo' }) } as unknown as Response)
    }
    return Promise.resolve({
      ok: true,
      json: async () => [{ id: '1', title: boardName }],
    } as unknown as Response)
  })
}

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
    global.fetch = makeDefaultFetch()
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
      if (String(url).includes('/cards') && !String(url).includes('/cards/') && (!init?.method || init.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => SEED_CARDS_JSON } as unknown as Response)
      }
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
    global.fetch = makeDefaultFetch('Sprint Board')
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

// ---------------------------------------------------------------------------
// Board label activity feed
// ---------------------------------------------------------------------------

const BUG_LABEL: Label = { id: 'label-1', name: 'Bug', color: '#C0392B' }

describe('Board label activity feed', () => {
  beforeEach(() => {
    capturedOnDragEnd = null
    global.fetch = makeDefaultFetch('BanyanBoard', [BUG_LABEL])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds a "label added" feed entry when a label is attached to a card', async () => {
    render(<Board />)

    // Wait for labels to load — filter bar appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
    })

    // Open label picker on the first seed card
    const addLabelBtn = screen.getByRole('button', { name: /add label to design login page/i })
    await userEvent.click(addLabelBtn)

    // Popover opens as a dialog
    const dialog = await screen.findByRole('dialog')
    const bugChip = within(dialog).getByRole('button', { name: /bug/i })
    await userEvent.click(bugChip)

    // Feed entry with "label added"
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem')
      const labelEntry = listItems.find(
        (li) => li.textContent?.includes('Design login page') && li.textContent?.includes('Bug')
      )
      expect(labelEntry).toBeDefined()
    })
  })

  it('adds a "label removed" feed entry when a label is detached from a card', async () => {
    global.fetch = makeDefaultFetch('BanyanBoard', [BUG_LABEL])

    render(<Board />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
    })

    const addLabelBtn = screen.getByRole('button', { name: /add label to design login page/i })
    await userEvent.click(addLabelBtn)

    const dialog = await screen.findByRole('dialog')
    const bugChip = within(dialog).getByRole('button', { name: /bug/i })

    // First click → attach (label-added)
    await userEvent.click(bugChip)

    // Popover stays open; chip is now aria-pressed=true after optimistic update
    // Second click → detach (label-removed)
    await userEvent.click(bugChip)

    // Feed should include a "label removed" entry
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem')
      const removedEntry = listItems.find(
        (li) => li.textContent?.includes('Design login page') && li.textContent?.includes('removed')
      )
      expect(removedEntry).toBeDefined()
    })
  })
})
