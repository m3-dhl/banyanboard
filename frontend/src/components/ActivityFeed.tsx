import { COLUMNS } from '../types'
import type { ActivityFeedEntry } from '../types'

interface ActivityFeedProps {
  entries: ActivityFeedEntry[]
}

const columnLabelMap = Object.fromEntries(COLUMNS.map((col) => [col.id, col.label]))

const MAX_ENTRIES = 20

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  const visible = entries.slice(0, MAX_ENTRIES)

  return (
    <section aria-label="Activity feed">
      <h2>Activity</h2>
      {visible.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <div role="log" aria-label="Recent card activity" aria-live="polite">
          <ul>
            {visible.map((entry) => {
              const iso = entry.timestamp.toISOString()
              return (
                <li key={entry.id}>
                  <span>{entry.cardTitle}</span>
                  {entry.kind === 'move' ? (
                    <>
                      {' moved from '}
                      <span>{columnLabelMap[entry.fromColumn]}</span>
                      {' to '}
                      <span>{columnLabelMap[entry.toColumn]}</span>
                    </>
                  ) : (
                    <>
                      {' created in '}
                      <span>{columnLabelMap[entry.columnId]}</span>
                    </>
                  )}
                  {' — '}
                  <time dateTime={iso}>{iso}</time>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
