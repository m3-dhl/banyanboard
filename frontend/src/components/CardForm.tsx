import { useEffect, useRef, useState } from 'react'
import type { ColumnId } from '../types'

interface Props {
  columnId: ColumnId
  onAdd: (title: string) => void
  onCancel: () => void
}

export default function CardForm({ columnId, onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = `card-form-error-${columnId}`

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Title is required')
      inputRef.current?.focus()
      return
    }
    if (trimmed.length > 100) {
      setError('Title must be 100 characters or fewer')
      inputRef.current?.focus()
      return
    }
    onAdd(trimmed)
    setTitle('')
    setError('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Card title"
        aria-label="Card title"
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert" className="card-form-error">
          {error}
        </span>
      )}
      <div className="card-form-actions">
        <button type="submit">Add</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
