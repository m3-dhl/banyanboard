import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { CardData, CardDetail } from '../types'

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

function renderModal(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides }
  // Reset mocks for each render
  Object.values(props).forEach((v) => { if (typeof v === 'function' && 'mockReset' in v) (v as ReturnType<typeof vi.fn>).mockReset() })
  return render(<CardDetailModal {...props} />)
}

describe('CardDetailModal — detail view', () => {
  beforeEach(() => {
    vi.mocked(api.fetchCardDetail).mockResolvedValue({ ...CARD_DETAIL })
    vi.mocked(api.fetchComments).mockResolvedValue([])
    vi.mocked(api.updateCard).mockResolvedValue(undefined)
    vi.mocked(api.createComment).mockResolvedValue({
      id: 'c-1', cardId: 'card-1', body: 'test', createdAt: '2026-06-19T10:00:00Z',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders with role=dialog and aria-modal=true', async () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('shows loading state initially', () => {
    renderModal()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders card title from card prop while loading', () => {
    renderModal()
    expect(screen.getByText('Design login page')).toBeInTheDocument()
  })

  it('renders card body after detail loads', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).toBeNull()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows description placeholder when description is null', async () => {
    renderModal()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    expect(screen.getByText('Add a description…')).toBeInTheDocument()
  })

  it('renders markdown content when description is set', async () => {
    vi.mocked(api.fetchCardDetail).mockResolvedValue({
      ...CARD_DETAIL,
      description: '**bold text**',
    })
    renderModal()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    expect(screen.getByTestId('markdown-output')).toHaveTextContent('**bold text**')
  })

  it('shows empty state in comments section', async () => {
    renderModal()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
  })

  it('close button calls onClose', async () => {
    const onClose = vi.fn()
    render(<CardDetailModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('backdrop click calls onClose', async () => {
    const onClose = vi.fn()
    render(<CardDetailModal {...defaultProps} onClose={onClose} />)
    // modal-backdrop is aria-hidden, target it via class
    const backdrop = document.querySelector('.modal-backdrop')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('Escape key on container calls onClose', async () => {
    const onClose = vi.fn()
    render(<CardDetailModal {...defaultProps} onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('title edit: clicking title enters edit mode', async () => {
    renderModal()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    fireEvent.click(screen.getByText('Design login page'))
    expect(screen.getByRole('textbox', { name: /card title/i })).toBeInTheDocument()
  })

  it('title edit: blur triggers PATCH and calls onTitleChange on success', async () => {
    const onTitleChange = vi.fn()
    render(<CardDetailModal {...defaultProps} onTitleChange={onTitleChange} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    fireEvent.click(screen.getByText('Design login page'))
    const input = screen.getByRole('textbox', { name: /card title/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'New title')
    fireEvent.blur(input)

    await waitFor(() => {
      expect(api.updateCard).toHaveBeenCalledWith('card-1', { title: 'New title' })
      expect(onTitleChange).toHaveBeenCalledWith('card-1', 'New title')
    })
  })

  it('title edit: Enter saves and exits edit mode', async () => {
    const onTitleChange = vi.fn()
    render(<CardDetailModal {...defaultProps} onTitleChange={onTitleChange} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    fireEvent.click(screen.getByText('Design login page'))
    const input = screen.getByRole('textbox', { name: /card title/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Updated title')
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(api.updateCard).toHaveBeenCalledWith('card-1', { title: 'Updated title' })
    })
  })

  it('title edit: API failure shows error and does not call onTitleChange', async () => {
    vi.mocked(api.updateCard).mockRejectedValue(new Error('Network error'))
    const onTitleChange = vi.fn()
    render(<CardDetailModal {...defaultProps} onTitleChange={onTitleChange} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    fireEvent.click(screen.getByText('Design login page'))
    const input = screen.getByRole('textbox', { name: /card title/i })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to save title/i)
    })
    expect(onTitleChange).not.toHaveBeenCalled()
  })

  it('due date input change calls PATCH and onDueDateChange', async () => {
    const onDueDateChange = vi.fn()
    render(<CardDetailModal {...defaultProps} onDueDateChange={onDueDateChange} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    const dateInput = screen.getByLabelText(/due date/i)
    fireEvent.change(dateInput, { target: { value: '2026-06-25' } })

    await waitFor(() => {
      expect(api.updateCard).toHaveBeenCalledWith('card-1', { dueDate: '2026-06-25' })
      expect(onDueDateChange).toHaveBeenCalledWith('card-1', '2026-06-25')
    })
  })

  it('column selector change calls PATCH and onColumnChange', async () => {
    const onColumnChange = vi.fn()
    render(<CardDetailModal {...defaultProps} onColumnChange={onColumnChange} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    const select = screen.getByLabelText(/column/i)
    fireEvent.change(select, { target: { value: 'done' } })

    await waitFor(() => {
      expect(api.updateCard).toHaveBeenCalledWith('card-1', { columnId: 'done' })
      expect(onColumnChange).toHaveBeenCalledWith('card-1', 'done')
    })
  })

  it('description Edit button switches to edit mode', async () => {
    renderModal()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /edit description/i }))
    expect(screen.getByRole('textbox', { name: /card description/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('description Save calls PATCH and onDescriptionChange', async () => {
    const onDescriptionChange = vi.fn()
    render(<CardDetailModal {...defaultProps} onDescriptionChange={onDescriptionChange} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /edit description/i }))
    const textarea = screen.getByRole('textbox', { name: /card description/i })
    await userEvent.type(textarea, 'My description')
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(api.updateCard).toHaveBeenCalledWith('card-1', { description: 'My description' })
      expect(onDescriptionChange).toHaveBeenCalledWith('card-1')
    })
  })

  it('description Cancel exits edit mode without saving', async () => {
    renderModal()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /edit description/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('textbox', { name: /card description/i })).toBeNull()
    expect(api.updateCard).not.toHaveBeenCalled()
  })

  it('shows offline notice when apiError=true and detail fails to load', async () => {
    vi.mocked(api.fetchCardDetail).mockRejectedValue(new Error('offline'))
    render(<CardDetailModal {...defaultProps} apiError={true} />)
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
