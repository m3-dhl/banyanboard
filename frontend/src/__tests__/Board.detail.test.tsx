import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Board from '../components/Board'

vi.mock('react-markdown', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children }: any) => <div data-testid="markdown-output">{children}</div>,
}))

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

const SEED_CARDS_JSON = [
  { id: 'card-1', title: 'Design login page', columnId: 'todo', due_date: null },
  { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress', due_date: null },
]

const CARD_DETAIL = {
  id: 'card-1',
  title: 'Design login page',
  columnId: 'todo',
  labels: [],
  description: null,
  due_date: null,
}

function makeDefaultFetch() {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/cards/card-1/comments')) {
      return Promise.resolve({ ok: true, json: async () => [] } as unknown as Response)
    }
    if (u.match(/\/cards\/[^/]+$/) && (!init?.method || init.method === 'GET')) {
      return Promise.resolve({ ok: true, json: async () => CARD_DETAIL } as unknown as Response)
    }
    if (u.match(/\/cards\/[^/]+$/) && init?.method === 'PATCH') {
      return Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response)
    }
    if (u.includes('/cards') && !u.includes('/cards/')) {
      return Promise.resolve({ ok: true, json: async () => SEED_CARDS_JSON } as unknown as Response)
    }
    if (u.includes('/labels') && u.includes('boardId=')) {
      return Promise.resolve({ ok: true, json: async () => [] } as unknown as Response)
    }
    return Promise.resolve({
      ok: true,
      json: async () => [{ id: '1', title: 'BanyanBoard' }],
    } as unknown as Response)
  })
}

describe('Board — card detail integration', () => {
  beforeEach(() => {
    global.fetch = makeDefaultFetch()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clicking a card body (genuine pointer click) opens CardDetailModal', async () => {
    render(<Board />)
    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 101, clientY: 100 })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('CardDetailModal closes when close button clicked', async () => {
    render(<Board />)
    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('description change adds description-changed feed entry', async () => {
    render(<Board />)
    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

    // Wait for modal to load
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).toBeNull()
    })

    fireEvent.click(screen.getByRole('button', { name: /edit description/i }))
    const textarea = screen.getByRole('textbox', { name: /card description/i })
    fireEvent.change(textarea, { target: { value: 'Updated desc' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      const feedItems = screen.queryAllByRole('listitem')
      const descEntry = feedItems.find((li) => li.textContent?.includes('description updated'))
      expect(descEntry).toBeDefined()
    })
  })

  it('comment posted adds comment-added feed entry', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/cards/card-1/comments') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'c-new', card_id: 'card-1', body: 'Nice card', created_at: '2026-06-19T10:00:00Z' }),
        } as unknown as Response)
      }
      return makeDefaultFetch()(url, init)
    })

    render(<Board />)
    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    const commentTextarea = screen.getByRole('textbox', { name: /comment text/i })
    fireEvent.change(commentTextarea, { target: { value: 'Nice card' } })
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }))

    await waitFor(() => {
      const feedItems = screen.queryAllByRole('listitem')
      const commentEntry = feedItems.find((li) => li.textContent?.includes('comment added'))
      expect(commentEntry).toBeDefined()
    })
  })

  it('due date change updates card dueDate in Board state and adds feed entry', async () => {
    render(<Board />)
    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    const dateInput = screen.getByLabelText(/due date/i)
    fireEvent.change(dateInput, { target: { value: '2026-06-30' } })

    await waitFor(() => {
      const feedItems = screen.queryAllByRole('listitem')
      const dateEntry = feedItems.find((li) => li.textContent?.includes('due date changed'))
      expect(dateEntry).toBeDefined()
    })
  })

  it('title change in modal reflects updated title on the board card', async () => {
    const user = userEvent.setup()
    render(<Board />)

    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

    // Wait for the detail to finish loading
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    // Click the title h2 to enter edit mode
    fireEvent.click(screen.getByRole('heading', { name: /design login page/i }))

    // The title input should now be visible
    const titleInput = screen.getByRole('textbox', { name: /card title/i })
    await user.clear(titleInput)
    await user.type(titleInput, 'Renamed card')

    // Press Enter to save
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })

    // Wait for the PATCH fetch to be called (title save)
    await waitFor(() => {
      const fetchMock = global.fetch as ReturnType<typeof vi.fn>
      const patchCall = fetchMock.mock.calls.find(
        ([url, init]: [string, RequestInit]) =>
          String(url).match(/\/cards\/card-1$/) && init?.method === 'PATCH'
      )
      expect(patchCall).toBeDefined()
    })

    // Close the modal
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).toBeNull()

    // The board card should now display the new title
    expect(screen.getByRole('article', { name: /renamed card/i })).toBeInTheDocument()
  })

  it('column change in modal reflects updated column in board state', async () => {
    render(<Board />)

    const card = screen.getByRole('article', { name: /design login page/i })
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

    // Wait for the detail to finish loading
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    // Change the column select to 'done'
    const columnSelect = screen.getByRole('combobox', { name: /column/i })
    fireEvent.change(columnSelect, { target: { value: 'done' } })

    // Wait for the PATCH fetch to be called (column save)
    await waitFor(() => {
      const fetchMock = global.fetch as ReturnType<typeof vi.fn>
      const patchCall = fetchMock.mock.calls.find(
        ([url, init]: [string, RequestInit]) =>
          String(url).match(/\/cards\/card-1$/) && init?.method === 'PATCH'
      )
      expect(patchCall).toBeDefined()
    })

    // Close the modal
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).toBeNull()

    // The card should still be in the board (moved to done column)
    expect(screen.getByRole('article', { name: /design login page/i })).toBeInTheDocument()
  })

  it('closing modal returns focus to the originating card element', async () => {
    vi.useFakeTimers()
    try {
      render(<Board />)

      // Open modal by pointer events on card-1
      const card = screen.getByRole('article', { name: /design login page/i })
      fireEvent.pointerDown(card, { clientX: 100, clientY: 100 })
      fireEvent.pointerUp(card, { clientX: 100, clientY: 100 })

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Close the modal via the close button
      fireEvent.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByRole('dialog')).toBeNull()

      // Advance the setTimeout(0) used by handleCloseDetail to return focus
      await vi.runAllTimersAsync()

      // Focus should have been returned to the card that opened the modal
      expect(document.activeElement).toBe(document.getElementById('card-1'))
    } finally {
      vi.useRealTimers()
    }
  })
})
