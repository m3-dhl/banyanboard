import { COLUMNS } from '../types'
import type { ActivityFeedEntry } from '../types'

interface ActivityFeedProps {
  entries: ActivityFeedEntry[]
}

const columnLabelMap = Object.fromEntries(COLUMNS.map((col) => [col.id, col.label]))

const MAX_ENTRIES = 20

function formatTime(date: Date): string {
  const now = Date.now()
  const diff = Math.floor((now - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  const visible = entries.slice(0, MAX_ENTRIES)

  return (
    <section className="activity-feed" aria-label="Activity feed">
      <h2 className="activity-feed-heading">Activity</h2>
      {visible.length === 0 ? (
        <p className="activity-feed-empty">No activity yet.</p>
      ) : (
        <ul
          className="activity-feed-list"
          role="log"
          aria-label="Recent card activity"
          aria-live="polite"
        >
          {visible.map((entry) => {
            const iso = entry.timestamp.toISOString()
            return (
              <li key={entry.id} className="activity-feed-entry">
                <span>
                  <span className="activity-entry-card">{entry.cardTitle}</span>
                  {entry.kind === 'move' ? (
                    <>
                      {' moved from '}
                      <span>{columnLabelMap[entry.fromColumn]}</span>
                      {' to '}
                      <span>{columnLabelMap[entry.toColumn]}</span>
                    </>
                  ) : entry.kind === 'created' ? (
                    <>
                      {' created in '}
                      <span>{columnLabelMap[entry.columnId]}</span>
                    </>
                  ) : entry.kind === 'label-added' ? (
                    <>
                      {' label '}
                      <span>{entry.labelName}</span>
                      {' added'}
                    </>
                  ) : (
                    <>
                      {' label '}
                      <span>{entry.labelName}</span>
                      {' removed'}
                    </>
                  )}
                </span>
                <time className="activity-entry-time" dateTime={iso}>
                  {formatTime(entry.timestamp)}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
