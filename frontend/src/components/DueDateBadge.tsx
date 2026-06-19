interface Props {
  dueDate: string | null | undefined
}

function parseDateLocal(iso: string): Date {
  const parts = iso.substring(0, 10).split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export default function DueDateBadge({ dueDate }: Props) {
  if (!dueDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = parseDateLocal(dueDate)
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let state: 'overdue' | 'upcoming' | 'neutral'
  let stateLabel: string

  if (diffDays < 0) {
    state = 'overdue'
    stateLabel = 'overdue'
  } else if (diffDays <= 3) {
    state = 'upcoming'
    stateLabel = 'due soon'
  } else {
    state = 'neutral'
    stateLabel = 'due'
  }

  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <span
      className={`due-date-badge due-date-badge--${state}`}
      aria-label={`Due ${formatted} — ${stateLabel}`}
    >
      {formatted}
    </span>
  )
}
