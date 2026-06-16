import { useEffect, useId, useRef } from 'react'
import type { Label } from '../types'
import { useFocusTrap } from '../hooks/useFocusTrap'

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

interface Props {
  labels: Label[]
  attachedLabelIds: string[]
  onToggle: (labelId: string) => void
  onManageLabels: () => void
  onClose: () => void
  anchorRect?: DOMRect
}

export default function LabelPickerPopover({
  labels,
  attachedLabelIds,
  onToggle,
  onManageLabels,
  onClose,
  anchorRect,
}: Props) {
  const headingId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, true)

  // Keyboard: Escape closes the popover (attached to container so it doesn't
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

  // Compute position based on anchor rect
  let positionStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0 }
  if (anchorRect) {
    const POPOVER_HEIGHT = 220
    const spaceBelow = window.innerHeight - anchorRect.bottom
    if (spaceBelow < POPOVER_HEIGHT) {
      positionStyle = {
        position: 'fixed',
        bottom: window.innerHeight - anchorRect.top,
        left: anchorRect.left,
      }
    } else {
      positionStyle = {
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="label-picker-popover"
      role="dialog"
      aria-labelledby={headingId}
      style={positionStyle}
    >
      <p id={headingId} className="label-picker-heading">
        Labels
      </p>

      {labels.length === 0 ? (
        <p className="label-picker-empty">No labels yet</p>
      ) : (
        <ul className="label-picker-list" role="list">
          {labels.map((label) => {
            const isAttached = attachedLabelIds.includes(label.id)
            const safeColor = HEX_PATTERN.test(label.color) ? label.color : '#616A6B'
            return (
              <li key={label.id}>
                <button
                  type="button"
                  className="label-chip"
                  aria-pressed={isAttached}
                  style={{ backgroundColor: safeColor }}
                  onClick={() => onToggle(label.id)}
                >
                  {label.name}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        className="label-picker-manage-btn"
        onClick={onManageLabels}
      >
        Manage labels
      </button>
    </div>
  )
}
