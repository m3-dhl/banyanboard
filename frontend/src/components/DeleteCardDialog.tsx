import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Props {
  cardTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteCardDialog({ cardTitle, onConfirm, onCancel }: Props) {
  const headingId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCancel()
      }
    }
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onCancel} aria-hidden="true" />
      <div
        ref={containerRef}
        className="delete-card-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <h2 id={headingId} className="delete-card-dialog-heading">
          Delete card
        </h2>
        <p className="delete-card-dialog-title">{cardTitle}</p>
        <p className="delete-card-dialog-warning">This action cannot be undone</p>
        <div className="delete-card-dialog-actions">
          <button type="button" className="delete-card-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="delete-card-confirm-btn" onClick={onConfirm}>
            Delete permanently
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
