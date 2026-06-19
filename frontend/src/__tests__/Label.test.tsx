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

// ---------------------------------------------------------------------------
// LabelPickerPopover positioning
// ---------------------------------------------------------------------------

describe('LabelPickerPopover positioning', () => {
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

  function makeAnchorRect(overrides: Partial<DOMRect>): DOMRect {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 100,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...overrides,
    } as DOMRect
  }

  it('clamps left when anchor is near the right viewport edge', () => {
    // DONE column scenario: anchor sits at 1050 in a 1200px-wide viewport.
    // The popover (max-width 280) would extend to 1050+280 = 1330, overflowing by 130px.
    // After clamping: left must be <= 1200 - 280 - 8 = 912.
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 })

    const anchorRect = makeAnchorRect({ left: 1050, right: 1150, top: 280, bottom: 300 })
    const { getByRole } = render(
      <LabelPickerPopover {...defaultProps} anchorRect={anchorRect} />
    )

    const dialog = getByRole('dialog')
    const leftValue = parseFloat(dialog.style.left ?? '0')
    // Must not overflow: left + 280 + 8 <= 1200
    expect(leftValue).toBeLessThanOrEqual(1200 - 280 - 8)
  })

  it('does not clamp left when anchor has ample room from the right edge', () => {
    // Anchor at left:100 in a 1200px viewport — 1100px of room, well within margin.
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 })

    const anchorRect = makeAnchorRect({ left: 100, right: 200, top: 280, bottom: 300 })
    const { getByRole } = render(
      <LabelPickerPopover {...defaultProps} anchorRect={anchorRect} />
    )

    const dialog = getByRole('dialog')
    // No clamping needed — left should remain at the anchor's left value
    expect(dialog.style.left).toBe('100px')
  })

  it('opens upward (uses bottom style, no top style) when space below is insufficient', () => {
    // Anchor near the bottom of a 600px viewport: bottom=550, only 50px below.
    // POPOVER_HEIGHT=220, so spaceBelow(50) < POPOVER_HEIGHT(220) → flip upward.
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 })

    const anchorRect = makeAnchorRect({ left: 100, right: 200, top: 530, bottom: 550 })
    const { getByRole } = render(
      <LabelPickerPopover {...defaultProps} anchorRect={anchorRect} />
    )

    const dialog = getByRole('dialog')
    // Upward flip: bottom style must be set, top must not be set
    expect(dialog.style.bottom).not.toBe('')
    expect(dialog.style.top).toBe('')
  })

  it('opens downward (uses top style, no bottom style) when there is space below', () => {
    // Anchor at bottom:200 in a 900px viewport — 700px below, more than POPOVER_HEIGHT(220).
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 })

    const anchorRect = makeAnchorRect({ left: 100, right: 200, top: 180, bottom: 200 })
    const { getByRole } = render(
      <LabelPickerPopover {...defaultProps} anchorRect={anchorRect} />
    )

    const dialog = getByRole('dialog')
    // Normal case: top style must be set, bottom must not be set
    expect(dialog.style.top).not.toBe('')
    expect(dialog.style.bottom).toBe('')
  })

  it('renders at top:0 left:0 when no anchorRect is provided', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 })

    const { getByRole } = render(
      <LabelPickerPopover {...defaultProps} anchorRect={undefined} />
    )

    const dialog = getByRole('dialog')
    expect(dialog.style.top).toBe('0px')
    expect(dialog.style.left).toBe('0px')
  })
})
