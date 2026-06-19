import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { COLUMNS } from '../types'
import type { CardData, CardDetail, Comment, ColumnId, Label } from '../types'
import { fetchCardDetail, updateCard, fetchComments, createComment } from '../api'
import { useFocusTrap } from '../hooks/useFocusTrap'
import DescriptionSection from './DescriptionSection'
import CommentsSection from './CommentsSection'

interface Props {
  cardId: string
  card: CardData
  labels: Label[]
  apiError: boolean
  onClose: () => void
  onTitleChange: (cardId: string, newTitle: string) => void
  onDescriptionChange: (cardId: string) => void
  onDueDateChange: (cardId: string, dueDate: string | null) => void
  onColumnChange: (cardId: string, newColumnId: ColumnId) => void
  onLabelToggle: (cardId: string, labelId: string) => void
  onCommentAdded: (cardId: string, cardTitle: string) => void
}

export default function CardDetailModal({
  cardId,
  card,
  labels,
  apiError,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onColumnChange,
  onLabelToggle,
  onCommentAdded,
}: Props) {
  const headingId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, true)

  const [detail, setDetail] = useState<CardDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)

  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [titleSaving, setTitleSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    Promise.allSettled([fetchCardDetail(cardId, controller.signal), fetchComments(cardId, controller.signal)]).then(
      ([detailResult, commentsResult]) => {
        if (controller.signal.aborted) return
        if (detailResult.status === 'fulfilled') {
          setDetail(detailResult.value)
          setDetailError(null)
        } else {
          setDetailError('Failed to load card details')
        }
        setDetailLoading(false)
        if (commentsResult.status === 'fulfilled') {
          setComments(commentsResult.value)
        }
        setCommentsLoading(false)
      }
    )

    return () => controller.abort()
  }, [cardId])

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

  function handleTitleEditStart() {
    setTitleDraft(detail?.title ?? card.title)
    setTitleError(null)
    setTitleEditing(true)
  }

  async function handleTitleSave() {
    const trimmed = titleDraft.trim()
    if (!trimmed) {
      setTitleError('Title cannot be empty')
      return
    }
    setTitleSaving(true)
    setTitleError(null)
    try {
      await updateCard(cardId, { title: trimmed })
      setDetail((prev) => (prev ? { ...prev, title: trimmed } : null))
      onTitleChange(cardId, trimmed)
      setTitleEditing(false)
    } catch {
      setTitleError('Failed to save title — please try again')
    } finally {
      setTitleSaving(false)
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleTitleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setTitleEditing(false)
      setTitleError(null)
    }
  }

  async function handleDescriptionSave(description: string): Promise<void> {
    await updateCard(cardId, { description })
    setDetail((prev) => (prev ? { ...prev, description } : null))
    onDescriptionChange(cardId)
  }

  async function handleDueDateChange(value: string): Promise<void> {
    const dueDate = value || null
    try {
      await updateCard(cardId, { dueDate })
      setDetail((prev) => (prev ? { ...prev, dueDate } : null))
      onDueDateChange(cardId, dueDate)
    } catch {
      // Leave existing value; user can retry
    }
  }

  async function handleColumnChange(newColumnId: ColumnId): Promise<void> {
    try {
      await updateCard(cardId, { columnId: newColumnId })
      setDetail((prev) => (prev ? { ...prev, columnId: newColumnId } : null))
      onColumnChange(cardId, newColumnId)
    } catch {
      // Revert local state to previous
      setDetail((prev) => (prev ? { ...prev } : null))
    }
  }

  async function handlePostComment(body: string): Promise<void> {
    const optimisticId = `pending-${Date.now()}`
    const optimistic: Comment = {
      id: optimisticId,
      cardId,
      body,
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setComments((prev) => [...prev, optimistic])
    try {
      const newComment = await createComment(cardId, body)
      setComments((prev) =>
        prev.filter((c) => c.id !== optimisticId).concat({ ...newComment, pending: false })
      )
      onCommentAdded(cardId, detail?.title ?? card.title)
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimisticId))
      throw new Error('Failed to post comment')
    }
  }

  const currentLabels = card.labels ?? []
  const attachedLabelIds = new Set(currentLabels.map((l) => l.id))

  const displayTitle = detail?.title ?? card.title

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="card-detail-modal"
      >
        <div className="card-detail-modal-header">
          {titleEditing ? (
            <input
              id={headingId}
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => void handleTitleSave()}
              onKeyDown={handleTitleKeyDown}
              className="card-detail-title-input"
              aria-label="Card title"
              maxLength={100}
              disabled={titleSaving}
            />
          ) : (
            <h2
              id={headingId}
              className="card-detail-title"
              onClick={handleTitleEditStart}
              title="Click to edit title"
            >
              {displayTitle}
            </h2>
          )}
          <button
            type="button"
            className="card-detail-close-btn"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {titleError && (
          <p className="card-detail-title-error" role="alert">
            {titleError}
          </p>
        )}

        {detailLoading ? (
          <p className="card-detail-loading" aria-live="polite">
            Loading…
          </p>
        ) : detailError && !detail ? (
          <div className="card-detail-offline-notice">
            <p>Unavailable — backend is offline</p>
          </div>
        ) : (
          <div className="card-detail-body">
            <div className="card-detail-metadata">
              <label className="card-detail-field">
                <span className="card-detail-field-label">Column</span>
                <select
                  className="card-detail-column-select"
                  value={detail?.columnId ?? card.columnId}
                  onChange={(e) => void handleColumnChange(e.target.value as ColumnId)}
                  aria-label="Column"
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="card-detail-field">
                <span className="card-detail-field-label">Due date</span>
                <input
                  type="date"
                  className="card-detail-due-date"
                  value={detail?.dueDate?.substring(0, 10) ?? ''}
                  onChange={(e) => void handleDueDateChange(e.target.value)}
                  aria-label="Due date"
                />
              </label>

              {labels.length > 0 && (
                <div className="card-detail-labels-field">
                  <span className="card-detail-field-label">Labels</span>
                  <div className="card-detail-labels">
                    {labels.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        className="label-chip"
                        style={{ backgroundColor: label.color, opacity: attachedLabelIds.has(label.id) ? 1 : 0.35 }}
                        onClick={() => onLabelToggle(cardId, label.id)}
                        aria-pressed={attachedLabelIds.has(label.id)}
                      >
                        {label.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DescriptionSection
              description={detail?.description ?? null}
              offline={apiError && !detail}
              onSave={handleDescriptionSave}
            />

            <CommentsSection
              comments={comments}
              loading={commentsLoading}
              offline={apiError && !detail}
              onPost={handlePostComment}
            />
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
