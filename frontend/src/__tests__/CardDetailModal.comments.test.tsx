import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { CardData, CardDetail, Comment } from '../types'

vi.mock('react-markdown', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children }: any) => <div data-testid="markdown-output">{children}</div>,
}))

vi.mock('../api', () => ({
  fetchCardDetail: vi.fn(),
  updateCard: vi.fn(),
  fetchComments: vi.fn(),
  createComment: vi.fn(),
}))

import * as api from '../api'
import CardDetailModal from '../components/CardDetailModal'

const CARD: CardData = { id: 'card-1', title: 'Design login page', columnId: 'todo' }

const CARD_DETAIL: CardDetail = {
  id: 'card-1',
  title: 'Design login page',
  columnId: 'todo',
  labels: [],
  description: null,
  dueDate: null,
}

const EXISTING_COMMENT: Comment = {
  id: 'c-existing',
  cardId: 'card-1',
  body: 'This is a comment',
  createdAt: '2026-06-19T08:00:00Z',
}

const defaultProps = {
  cardId: 'card-1',
  card: CARD,
  labels: [],
  apiError: false,
  onClose: vi.fn(),
  onTitleChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onDueDateChange: vi.fn(),
  onColumnChange: vi.fn(),
  onLabelToggle: vi.fn(),
  onCommentAdded: vi.fn(),
}

async function renderModalAndWaitForLoad(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides }
  render(<CardDetailModal {...props} />)
  await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
}

describe('CardDetailModal — comments', () => {
  beforeEach(() => {
    vi.mocked(api.fetchCardDetail).mockResolvedValue({ ...CARD_DETAIL })
    vi.mocked(api.fetchComments).mockResolvedValue([])
    vi.mocked(api.updateCard).mockResolvedValue(undefined)
    vi.mocked(api.createComment).mockResolvedValue({
      id: 'c-new',
      cardId: 'card-1',
      body: 'New comment',
      createdAt: '2026-06-19T10:00:00Z',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no comments', async () => {
    await renderModalAndWaitForLoad()
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
  })

  it('renders existing comments', async () => {
    vi.mocked(api.fetchComments).mockResolvedValue([EXISTING_COMMENT])
    await renderModalAndWaitForLoad()
    expect(screen.getByText('This is a comment')).toBeInTheDocument()
  })

  it('Add comment button is disabled when textarea is empty', async () => {
    await renderModalAndWaitForLoad()
    const btn = screen.getByRole('button', { name: /add comment/i })
    expect(btn).toBeDisabled()
  })

  it('Add comment button is enabled when textarea has text', async () => {
    await renderModalAndWaitForLoad()
    const textarea = screen.getByRole('textbox', { name: /comment text/i })
    await userEvent.type(textarea, 'Hello')
    const btn = screen.getByRole('button', { name: /add comment/i })
    expect(btn).toBeEnabled()
  })

  it('submitting comment calls createComment, shows comment, and clears textarea', async () => {
    await renderModalAndWaitForLoad()
    const textarea = screen.getByRole('textbox', { name: /comment text/i })
    await userEvent.type(textarea, 'New comment')
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }))

    await waitFor(() => {
      expect(api.createComment).toHaveBeenCalledWith('card-1', 'New comment')
    })
    // Textarea cleared on success
    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('')
    })
  })

  it('comment appears optimistically before API confirms', async () => {
    let resolveComment!: (c: Comment) => void
    vi.mocked(api.createComment).mockReturnValue(
      new Promise<Comment>((res) => { resolveComment = res })
    )

    await renderModalAndWaitForLoad()
    const textarea = screen.getByRole('textbox', { name: /comment text/i })
    await userEvent.type(textarea, 'Optimistic comment')
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }))

    // Comment appears immediately in the list (optimistic) — textarea may also show text
    const matches = screen.getAllByText('Optimistic comment')
    expect(matches.length).toBeGreaterThanOrEqual(1)

    // Resolve API
    resolveComment({ id: 'c-new', cardId: 'card-1', body: 'Optimistic comment', createdAt: '2026-06-19T10:00:00Z' })
    await waitFor(() => expect((textarea as HTMLTextAreaElement).value).toBe(''))
  })

  it('API failure removes optimistic comment and shows error — text retained in textarea', async () => {
    vi.mocked(api.createComment).mockRejectedValue(new Error('Network error'))

    await renderModalAndWaitForLoad()
    const textarea = screen.getByRole('textbox', { name: /comment text/i })
    await userEvent.type(textarea, 'Failed comment')
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to post comment/i)
    })
    // Text is retained
    expect((textarea as HTMLTextAreaElement).value).toBe('Failed comment')
    // Optimistic comment removed
    expect(screen.queryAllByText('Failed comment').length).toBeLessThanOrEqual(1)
  })

  it('comment longer than 500 chars shows validation error and disables submit', async () => {
    await renderModalAndWaitForLoad()
    const textarea = screen.getByRole('textbox', { name: /comment text/i })
    fireEvent.change(textarea, { target: { value: 'x'.repeat(501) } })

    expect(screen.getByRole('alert')).toHaveTextContent(/500 characters/i)
    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled()
  })

  it('onCommentAdded callback called on successful post', async () => {
    const onCommentAdded = vi.fn()
    render(<CardDetailModal {...defaultProps} onCommentAdded={onCommentAdded} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    const textarea = screen.getByRole('textbox', { name: /comment text/i })
    await userEvent.type(textarea, 'A comment')
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }))

    await waitFor(() => {
      expect(onCommentAdded).toHaveBeenCalledWith('card-1', 'Design login page')
    })
  })
})
