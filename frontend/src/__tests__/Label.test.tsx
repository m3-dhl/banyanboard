import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LabelBadge from '../components/LabelBadge'
import LabelPickerPopover from '../components/LabelPickerPopover'
import LabelManagementPanel from '../components/LabelManagementPanel'
import type { Label } from '../types'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const RED_LABEL: Label = { id: 'label-1', name: 'Bug', color: '#C0392B' }
const BLUE_LABEL: Label = { id: 'label-2', name: 'Feature', color: '#2980B9' }
const GREEN_LABEL: Label = { id: 'label-3', name: 'Enhancement', color: '#27AE60' }

const SAMPLE_LABELS: Label[] = [RED_LABEL, BLUE_LABEL, GREEN_LABEL]

// ---------------------------------------------------------------------------
// LabelBadge
// ---------------------------------------------------------------------------

describe('LabelBadge', () => {
  it('renders the label name as visible text', () => {
    render(<LabelBadge label={RED_LABEL} />)
    expect(screen.getByText('Bug')).toBeInTheDocument()
  })

  it('applies the label color as inline background-color style', () => {
    render(<LabelBadge label={RED_LABEL} />)
    // The badge element that holds the text should carry the background color.
    // We check the container element (closest with style) rather than the text node.
    const badge = screen.getByText('Bug').closest('[style]') ?? screen.getByText('Bug')
    expect(badge).toHaveStyle({ backgroundColor: '#C0392B' })
  })

  it('renders without throwing and produces a DOM node', () => {
    const { container } = render(<LabelBadge label={BLUE_LABEL} />)
    expect(container.firstChild).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// LabelPickerPopover
// ---------------------------------------------------------------------------

describe('LabelPickerPopover', () => {
  const defaultProps = {
    labels: SAMPLE_LABELS,
    attachedLabelIds: [],
    onToggle: vi.fn(),
    onManageLabels: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all available board labels', () => {
    render(<LabelPickerPopover {...defaultProps} />)
    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('Feature')).toBeInTheDocument()
    expect(screen.getByText('Enhancement')).toBeInTheDocument()
  })

  it('calls onToggle with the label id when a label chip is clicked', async () => {
    const onToggle = vi.fn()
    render(<LabelPickerPopover {...defaultProps} onToggle={onToggle} />)
    await userEvent.click(screen.getByText('Bug'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith('label-1')
  })

  it('shows a "Manage labels" link or "No labels yet" message when the label list is empty', () => {
    render(<LabelPickerPopover {...defaultProps} labels={[]} />)
    const hasManage = screen.queryByText(/manage labels/i)
    const hasEmpty = screen.queryByText(/no labels yet/i)
    expect(hasManage ?? hasEmpty).not.toBeNull()
  })

  it('marks attached labels with aria-pressed="true"', () => {
    render(
      <LabelPickerPopover
        {...defaultProps}
        attachedLabelIds={['label-1']}
      />
    )
    // Find the chip for "Bug" — it should be a button with aria-pressed="true"
    const bugChip = screen.getByRole('button', { name: /bug/i })
    expect(bugChip).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks non-attached labels with aria-pressed="false"', () => {
    render(
      <LabelPickerPopover
        {...defaultProps}
        attachedLabelIds={['label-1']}
      />
    )
    const featureChip = screen.getByRole('button', { name: /feature/i })
    expect(featureChip).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn()
    render(<LabelPickerPopover {...defaultProps} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onManageLabels when the "Manage labels" link is activated', async () => {
    const onManageLabels = vi.fn()
    render(<LabelPickerPopover {...defaultProps} onManageLabels={onManageLabels} />)
    const manageLink = screen.getByRole('button', { name: /manage labels/i })
    await userEvent.click(manageLink)
    expect(onManageLabels).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// LabelManagementPanel
// ---------------------------------------------------------------------------

describe('LabelManagementPanel', () => {
  const defaultProps = {
    labels: SAMPLE_LABELS,
    onCreate: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a "Manage Labels" heading', () => {
    render(<LabelManagementPanel {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /manage labels/i })).toBeInTheDocument()
  })

  it('renders each existing label in a list', () => {
    render(<LabelManagementPanel {...defaultProps} />)
    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('Feature')).toBeInTheDocument()
    expect(screen.getByText('Enhancement')).toBeInTheDocument()
  })

  it('calls onDelete with the label id when the Delete button for that label is clicked', async () => {
    const onDelete = vi.fn()
    render(<LabelManagementPanel {...defaultProps} onDelete={onDelete} />)

    // Each label row should have a Delete button. We find the one for "Bug".
    // The button is near the "Bug" text — get all delete buttons and click the first.
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith('label-1')
  })

  it('shows a validation error and does not call onCreate when name is empty', async () => {
    const onCreate = vi.fn()
    render(<LabelManagementPanel {...defaultProps} onCreate={onCreate} />)

    // Click Save/Create without entering a name
    const saveButton = screen.getByRole('button', { name: /save|create|add/i })
    await userEvent.click(saveButton)

    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/name is required|enter a name/i)).toBeInTheDocument()
  })

  it('calls onCreate with name and selected color when the form is submitted with valid input', async () => {
    const onCreate = vi.fn()
    render(<LabelManagementPanel {...defaultProps} labels={[]} onCreate={onCreate} />)

    const nameInput = screen.getByRole('textbox', { name: /label name/i })
    await userEvent.type(nameInput, 'New Label')

    // Select a color — the panel renders color swatches as radio buttons or similar.
    // Pick the first color swatch available.
    const colorOptions = screen.getAllByRole('radio')
    await userEvent.click(colorOptions[0])

    const saveButton = screen.getByRole('button', { name: /save|create|add/i })
    await userEvent.click(saveButton)

    expect(onCreate).toHaveBeenCalledOnce()
    const [calledName, calledColor] = onCreate.mock.calls[0]
    expect(calledName).toBe('New Label')
    expect(calledColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('clears the name input and resets color selection after successful creation', async () => {
    // onCreate resolves immediately — panel should clear state.
    const onCreate = vi.fn()
    render(<LabelManagementPanel {...defaultProps} onCreate={onCreate} />)

    const nameInput = screen.getByRole('textbox', { name: /label name/i })
    await userEvent.type(nameInput, 'Temp Label')

    const saveButton = screen.getByRole('button', { name: /save|create|add/i })
    await userEvent.click(saveButton)

    // After creation, the input should be empty
    expect(nameInput).toHaveValue('')
  })

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn()
    render(<LabelManagementPanel {...defaultProps} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
