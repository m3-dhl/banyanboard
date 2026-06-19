import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  description: string | null
  offline?: boolean
  onSave: (text: string) => Promise<void>
}

export default function DescriptionSection({ description, offline, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch {
      setError('Failed to save description — please try again')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(description ?? '')
    setEditing(false)
    setError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleCancel()
    }
  }

  if (offline) {
    return (
      <section className="description-section">
        <h3 className="description-section-heading">Description</h3>
        <p className="description-offline">Unavailable — backend is offline</p>
      </section>
    )
  }

  return (
    <section className="description-section">
      <div className="description-section-header">
        <h3 className="description-section-heading">Description</h3>
        {!editing && (
          <button
            type="button"
            className="description-edit-btn"
            aria-label="Edit description"
            onClick={() => { setDraft(description ?? ''); setEditing(true) }}
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="description-editor">
          <textarea
            ref={textareaRef}
            className="description-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a description…"
            aria-label="Card description"
            rows={5}
          />
          {error && (
            <p className="description-error" role="alert">
              {error}
            </p>
          )}
          <div className="description-actions">
            <button
              type="button"
              className="description-save-btn"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="description-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="description-view">
          {description ? (
            <div className="markdown-body"><ReactMarkdown>{description}</ReactMarkdown></div>
          ) : (
            <p className="description-placeholder">Add a description…</p>
          )}
        </div>
      )}
    </section>
  )
}
