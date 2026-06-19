import { useState } from 'react'
import type { Comment } from '../types'

const MAX_COMMENT_LENGTH = 500

interface Props {
  comments: Comment[]
  loading?: boolean
  offline?: boolean
  onPost: (body: string) => Promise<void>
}

export default function CommentsSection({ comments, loading, offline, onPost }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const tooLong = trimmed.length > MAX_COMMENT_LENGTH
  const submitDisabled = !trimmed || saving || tooLong

  async function handleSubmit() {
    if (submitDisabled) return
    setSaving(true)
    setError(null)
    try {
      await onPost(trimmed)
      setText('')
    } catch {
      setError('Failed to post comment — please try again')
    } finally {
      setSaving(false)
    }
  }

  if (offline) {
    return (
      <section className="comments-section">
        <h3 className="comments-section-heading">Comments</h3>
        <p className="comments-offline">Unavailable — backend is offline</p>
      </section>
    )
  }

  return (
    <section className="comments-section">
      <h3 className="comments-section-heading">Comments</h3>

      {loading ? (
        <p className="comments-loading">Loading comments…</p>
      ) : (
        <ul className="comments-list" aria-label="Comments">
          {comments.length === 0 ? (
            <li className="comments-empty">No comments yet. Be the first to comment.</li>
          ) : (
            comments.map((comment) => (
              <li
                key={comment.id}
                className={`comment-item${comment.pending ? ' comment-item--pending' : ''}`}
              >
                <p className="comment-body">{comment.body}</p>
                {comment.pending && <span className="comment-saving-indicator">Saving…</span>}
              </li>
            ))
          )}
        </ul>
      )}

      <div className="comment-form">
        <textarea
          className="comment-textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Add a comment…"
          aria-label="Comment text"
        />
        {tooLong && (
          <p className="comment-error" role="alert">
            Comment cannot exceed {MAX_COMMENT_LENGTH} characters
          </p>
        )}
        {error && !tooLong && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="comment-submit-btn"
          onClick={() => void handleSubmit()}
          disabled={submitDisabled}
        >
          {saving ? 'Adding…' : 'Add comment'}
        </button>
      </div>
    </section>
  )
}
