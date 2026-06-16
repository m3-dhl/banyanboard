import type { Label } from '../types'

interface Props {
  labels: Label[]
  activeFilter: string | null
  onFilterChange: (labelId: string | null) => void
}

export default function FilterBar({ labels, activeFilter, onFilterChange }: Props) {
  if (labels.length === 0) return null

  return (
    <div className="filter-bar">
      {labels.map((label) => {
        const isActive = activeFilter === label.id
        return (
          <button
            key={label.id}
            type="button"
            className={`filter-chip${isActive ? ' filter-chip--active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onFilterChange(isActive ? null : label.id)}
          >
            {label.name}
          </button>
        )
      })}
      {activeFilter !== null && (
        <button
          type="button"
          className="filter-chip-clear"
          onClick={() => onFilterChange(null)}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}
