import { useEffect, useId, useRef, useState } from 'react'
import type { Label } from '../types'
import { LABEL_COLORS } from '../types'
import { useFocusTrap } from '../hooks/useFocusTrap'
import LabelBadge from './LabelBadge'

interface Props {
  labels: Label[]
  onCreate: (name: string, color: string) => void
  onDelete: (labelId: string) => void
  onClose: () => void
}

export default function LabelManagementPanel({ labels, onCreate, onDelete, onClose }: Props) {
  const headingId = useId()
  const nameInputId = useId()
  const colorGroupId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, true)

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>(LABEL_COLORS[0].hex)
  const [nameError, setNameError] = useState<string | null>(null)

  // Keyboard: Escape closes the panel (attached to container so it doesn't
  // interfere with document-level dnd listeners)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(): void {
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError(null)
    onCreate(name.trim(), selectedColor)
    setName('')
    setSelectedColor(LABEL_COLORS[0].hex)
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        className="label-management-panel"
        role="dialog"
        aria-labelledby={headingId}
      >
      <h2 id={headingId} className="label-management-heading">
        Manage Labels
      </h2>

      {/* Existing labels list */}
      {labels.length > 0 && (
        <ul className="label-management-list" role="list">
          {labels.map((label) => (
            <li key={label.id} className="label-management-item">
              <LabelBadge label={label} />
              <button
                type="button"
                className="label-management-delete-btn"
                aria-label={`Delete label ${label.name}`}
                onClick={() => onDelete(label.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Create new label form */}
      <div className="label-management-form">
        <label htmlFor={nameInputId} className="label-management-input-label">
          Label name
        </label>
        <input
          id={nameInputId}
          type="text"
          className="label-management-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter label name"
        />
        {nameError && (
          <p role="alert" className="label-management-error">
            {nameError}
          </p>
        )}

        <fieldset className="label-color-fieldset">
          <legend id={colorGroupId} className="label-color-legend">
            Color
          </legend>
          <div className="label-color-swatches" role="radiogroup" aria-labelledby={colorGroupId}>
            {LABEL_COLORS.map((colorOption) => (
              <label key={colorOption.token} className="label-color-swatch-label">
                <input
                  type="radio"
                  name="color"
                  value={colorOption.hex}
                  checked={selectedColor === colorOption.hex}
                  onChange={() => setSelectedColor(colorOption.hex)}
                  aria-label={colorOption.name}
                />
                <span
                  className="label-color-swatch"
                  style={{ backgroundColor: colorOption.hex }}
                  title={colorOption.name}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="label-management-save-btn"
          onClick={handleSubmit}
        >
          Add label
        </button>
      </div>

      <button
        type="button"
        className="label-management-close-btn"
        onClick={onClose}
      >
        Close
      </button>
    </div>
    </>
  )
}
