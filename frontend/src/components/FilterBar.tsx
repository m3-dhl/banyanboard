import type { Label } from '../types'

interface Props {
  labels: Label[]
  activeFilters: string[]
  onFilterChange: (labelId: string) => void
  onFilterClear: () => void
}

export default function FilterBar({ labels, activeFilters, onFilterChange, onFilterClear }: Props) {
  if (labels.length === 0) return null

  return (
    <div className="filter-bar">
      {labels.map((label) => {
        const isActive = activeFilters.includes(label.id)
        return (
          <button
            key={label.id}
            type="button"
            className={`filter-chip${isActive ? ' filter-chip--active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onFilterChange(label.id)}
          >
            {label.name}
          </button>
        )
      })}
      {activeFilters.length > 0 && (
        <button
          type="button"
          className="filter-chip-clear"
          onClick={onFilterClear}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}
