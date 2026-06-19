import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Board from '../components/Board'
import * as api from '../api'
import type { Label } from '../types'

// ---------------------------------------------------------------------------
// DnD mock — not exercised in most tests here, but Board imports DnD
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API mock
// ---------------------------------------------------------------------------

vi.mock('../api', () => ({
  fetchBoards: vi.fn(),
  fetchCards: vi.fn(),
  createCard: vi.fn(),
  fetchLabels: vi.fn(),
  createLabel: vi.fn(),
  deleteLabel: vi.fn(),
  attachLabel: vi.fn(),
  detachLabel: vi.fn(),
  reorderCard: vi.fn(),
  deleteCard: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CARDS = [
  { id: 'card-todo',        title: 'Todo Card',         columnId: 'todo' as const,        labels: [] },
  { id: 'card-in-progress', title: 'In Progress Card',  columnId: 'in-progress' as const, labels: [] },
  { id: 'card-done',        title: 'Done Card',          columnId: 'done' as const,        labels: [] },
]

const BUG: Label  = { id: 'label-bug',  name: 'Bug',     color: '#C0392B' }
const FEAT: Label = { id: 'label-feat', name: 'Feature', color: '#2980B9' }

// ---------------------------------------------------------------------------
// Helper: render Board and wait until all three cards are visible
// ---------------------------------------------------------------------------

async function renderAndWait() {
  render(<Board />)
  await waitFor(() => {
    expect(screen.getByText('Todo Card')).toBeInTheDocument()
    expect(screen.getByText('In Progress Card')).toBeInTheDocument()
    expect(screen.getByText('Done Card')).toBeInTheDocument()
  })
}

// ---------------------------------------------------------------------------
// Label toggle — all columns
// ---------------------------------------------------------------------------

describe('Label toggle — all columns', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    vi.mocked(api.fetchCards).mockResolvedValue(CARDS)
    vi.mocked(api.fetchLabels).mockResolvedValue([BUG, FEAT])
    vi.mocked(api.attachLabel).mockResolvedValue(undefined)
    vi.mocked(api.detachLabel).mockResolvedValue(undefined)
  })

  it('attaches a label to a card in TODO column and shows it as attached', async () => {
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to todo card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    // Optimistic update: Bug badge should appear on Todo Card
    await waitFor(() => {
      const todoCard = screen.getByRole('article', { name: /todo card/i })
      expect(within(todoCard).getByText('Bug')).toBeInTheDocument()
    })
    expect(api.attachLabel).toHaveBeenCalledWith('card-todo', 'label-bug')
  })

  it('attaches a label to a card in IN-PROGRESS column and shows it as attached', async () => {
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to in progress card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    await waitFor(() => {
      const card = screen.getByRole('article', { name: /in progress card/i })
      expect(within(card).getByText('Bug')).toBeInTheDocument()
    })
    expect(api.attachLabel).toHaveBeenCalledWith('card-in-progress', 'label-bug')
  })

  it('attaches a label to a card in DONE column and shows it as attached', async () => {
    // Regression test: DONE is the rightmost column — this triggered the overflow bug.
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    await waitFor(() => {
      const doneCard = screen.getByRole('article', { name: /done card/i })
      expect(within(doneCard).getByText('Bug')).toBeInTheDocument()
    })
    expect(api.attachLabel).toHaveBeenCalledWith('card-done', 'label-bug')
  })

  it('picker closes automatically after label selection in DONE column', async () => {
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    // Picker must disappear after selection
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('picker closes automatically after label selection in TODO column', async () => {
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to todo card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('picker closes automatically after label selection in IN-PROGRESS column', async () => {
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to in progress card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Label toggle — detach
// ---------------------------------------------------------------------------

describe('Label toggle — detach', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    // Done Card starts with Bug already attached
    vi.mocked(api.fetchCards).mockResolvedValue([
      ...CARDS.filter((c) => c.id !== 'card-done'),
      { id: 'card-done', title: 'Done Card', columnId: 'done' as const, labels: [BUG] },
    ])
    vi.mocked(api.fetchLabels).mockResolvedValue([BUG, FEAT])
    vi.mocked(api.attachLabel).mockResolvedValue(undefined)
    vi.mocked(api.detachLabel).mockResolvedValue(undefined)
  })

  it('detaches an already-attached label from a card and removes the badge', async () => {
    await renderAndWait()

    // Bug badge should already be visible on Done Card (loaded from API)
    await waitFor(() => {
      const doneCard = screen.getByRole('article', { name: /done card/i })
      expect(within(doneCard).getByText('Bug')).toBeInTheDocument()
    })

    // Open picker — Bug chip must show aria-pressed="true" (already attached)
    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    const bugChip = within(dialog).getByRole('button', { name: /bug/i })
    expect(bugChip).toHaveAttribute('aria-pressed', 'true')

    // Click to detach
    await userEvent.click(bugChip)

    await waitFor(() => {
      const doneCard = screen.getByRole('article', { name: /done card/i })
      expect(within(doneCard).queryByText('Bug')).not.toBeInTheDocument()
    })
    expect(api.detachLabel).toHaveBeenCalledWith('card-done', 'label-bug')
  })
})

// ---------------------------------------------------------------------------
// Label toggle — API error handling
// ---------------------------------------------------------------------------

describe('Label toggle — API error handling', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    vi.mocked(api.fetchCards).mockResolvedValue(CARDS)
    vi.mocked(api.fetchLabels).mockResolvedValue([BUG, FEAT])
  })

  it('reverts optimistic add when attachLabel rejects', async () => {
    vi.mocked(api.attachLabel).mockRejectedValue(new Error('net'))

    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    // Error alert must appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to update label/i)
    })

    // Badge must NOT remain on the card (revert)
    const doneCard = screen.getByRole('article', { name: /done card/i })
    expect(within(doneCard).queryByText('Bug')).not.toBeInTheDocument()
  })

  it('reverts optimistic remove when detachLabel rejects', async () => {
    // Done Card starts with Bug attached
    vi.mocked(api.fetchCards).mockResolvedValue([
      ...CARDS.filter((c) => c.id !== 'card-done'),
      { id: 'card-done', title: 'Done Card', columnId: 'done' as const, labels: [BUG] },
    ])
    vi.mocked(api.detachLabel).mockRejectedValue(new Error('net'))

    await renderAndWait()

    // Verify Bug badge is present before detach attempt
    await waitFor(() => {
      expect(within(screen.getByRole('article', { name: /done card/i })).getByText('Bug')).toBeInTheDocument()
    })

    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))

    // Error must appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to update label/i)
    })

    // Bug badge must still be visible after revert
    const doneCard = screen.getByRole('article', { name: /done card/i })
    expect(within(doneCard).getByText('Bug')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Label toggle — multiple labels
// ---------------------------------------------------------------------------

describe('Label toggle — multiple labels', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    vi.mocked(api.fetchCards).mockResolvedValue(CARDS)
    vi.mocked(api.fetchLabels).mockResolvedValue([BUG, FEAT])
    vi.mocked(api.attachLabel).mockResolvedValue(undefined)
  })

  it('can attach multiple labels to the same card, showing both badges', async () => {
    await renderAndWait()

    // Attach Bug
    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)
    const dialog1 = await screen.findByRole('dialog')
    await userEvent.click(within(dialog1).getByRole('button', { name: /bug/i }))

    // Picker closed — re-open to attach Feature
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await userEvent.click(addBtn)
    const dialog2 = await screen.findByRole('dialog')
    await userEvent.click(within(dialog2).getByRole('button', { name: /feature/i }))

    // Both badges must be visible on the card
    await waitFor(() => {
      const doneCard = screen.getByRole('article', { name: /done card/i })
      expect(within(doneCard).getByText('Bug')).toBeInTheDocument()
      expect(within(doneCard).getByText('Feature')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Label toggle — with active filter
// ---------------------------------------------------------------------------

describe('Label toggle — with active filter', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    vi.mocked(api.fetchLabels).mockResolvedValue([BUG, FEAT])
    vi.mocked(api.attachLabel).mockResolvedValue(undefined)
    vi.mocked(api.detachLabel).mockResolvedValue(undefined)
  })

  it('card becomes visible after adding a label that matches the active filter', async () => {
    // Done Card has no labels initially — will be hidden when Bug filter is active.
    // Todo Card has Bug so it always stays visible as a reference anchor.
    vi.mocked(api.fetchCards).mockResolvedValue([
      { id: 'card-todo',        title: 'Todo Card',        columnId: 'todo' as const,        labels: [BUG] },
      { id: 'card-in-progress', title: 'In Progress Card', columnId: 'in-progress' as const, labels: [] },
      { id: 'card-done',        title: 'Done Card',        columnId: 'done' as const,        labels: [] },
    ])

    render(<Board />)
    // Wait for board to load — Done Card card article visible initially
    await waitFor(() => expect(screen.getByRole('article', { name: 'Done Card' })).toBeInTheDocument())

    // Activate Bug filter — Done Card has no Bug → card article must disappear
    const bugFilterChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugFilterChip)
    await waitFor(() => {
      expect(screen.queryByRole('article', { name: 'Done Card' })).not.toBeInTheDocument()
    })

    // Clear filter so Done Card is accessible again
    const clearBtn = await screen.findByRole('button', { name: /clear filter/i })
    await userEvent.click(clearBtn)
    await waitFor(() => expect(screen.getByRole('article', { name: 'Done Card' })).toBeInTheDocument())

    // Attach Bug to Done Card
    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Re-activate Bug filter — Done Card now has Bug → must be visible
    await userEvent.click(screen.getByRole('button', { name: /bug/i }))
    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Done Card' })).toBeInTheDocument()
    })
  })

  it('card disappears after removing the label that matches the active filter', async () => {
    // Done Card starts with Bug — visible under Bug filter.
    // Todo Card has no Bug so it acts as a control (always hidden under Bug filter).
    vi.mocked(api.fetchCards).mockResolvedValue([
      { id: 'card-todo',        title: 'Todo Card',        columnId: 'todo' as const,        labels: [] },
      { id: 'card-in-progress', title: 'In Progress Card', columnId: 'in-progress' as const, labels: [] },
      { id: 'card-done',        title: 'Done Card',        columnId: 'done' as const,        labels: [BUG] },
    ])

    render(<Board />)
    await waitFor(() => expect(screen.getByRole('article', { name: 'Done Card' })).toBeInTheDocument())

    // Activate Bug filter — Done Card has Bug so it stays visible
    const bugFilterChip = await screen.findByRole('button', { name: /bug/i })
    await userEvent.click(bugFilterChip)
    await waitFor(() => expect(screen.getByRole('article', { name: 'Done Card' })).toBeInTheDocument())

    // Clear filter so picker is accessible
    const clearBtn = await screen.findByRole('button', { name: /clear filter/i })
    await userEvent.click(clearBtn)

    // Detach Bug from Done Card
    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /bug/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Re-activate Bug filter — Done Card no longer has Bug → must be hidden
    await userEvent.click(screen.getByRole('button', { name: /bug/i }))
    await waitFor(() => {
      expect(screen.queryByRole('article', { name: 'Done Card' })).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// attachLabel / detachLabel API call validation
// ---------------------------------------------------------------------------

describe('attachLabel API call validation', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBoards).mockResolvedValue([{ id: 'b1', name: 'BanyanBoard' }])
    vi.mocked(api.fetchCards).mockResolvedValue(CARDS)
    vi.mocked(api.fetchLabels).mockResolvedValue([BUG, FEAT])
    vi.mocked(api.attachLabel).mockResolvedValue(undefined)
    vi.mocked(api.detachLabel).mockResolvedValue(undefined)
  })

  it('calls attachLabel with correct (cardId, labelId) arguments', async () => {
    await renderAndWait()

    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /feature/i }))

    await waitFor(() => {
      expect(api.attachLabel).toHaveBeenCalledWith('card-done', 'label-feat')
    })
  })

  it('calls detachLabel with correct (cardId, labelId) arguments', async () => {
    // Done Card starts with Feature attached
    vi.mocked(api.fetchCards).mockResolvedValue([
      ...CARDS.filter((c) => c.id !== 'card-done'),
      { id: 'card-done', title: 'Done Card', columnId: 'done' as const, labels: [FEAT] },
    ])

    render(<Board />)
    await waitFor(() => expect(screen.getByText('Done Card')).toBeInTheDocument())

    const addBtn = screen.getByRole('button', { name: /add label to done card/i })
    await userEvent.click(addBtn)
    const dialog = await screen.findByRole('dialog')
    // Feature is already attached — clicking again detaches
    await userEvent.click(within(dialog).getByRole('button', { name: /feature/i }))

    await waitFor(() => {
      expect(api.detachLabel).toHaveBeenCalledWith('card-done', 'label-feat')
    })
  })
})
