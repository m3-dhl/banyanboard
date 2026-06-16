import { useEffect, useState } from 'react'
import { COLUMNS, SEED_CARDS } from '../types'
import type { CardData } from '../types'
import { fetchBoards } from '../api'
import Column from './Column'

export default function Board() {
  const [cards, _setCards] = useState<CardData[]>(SEED_CARDS)
  const [boardName, setBoardName] = useState<string>('BanyanBoard')
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    fetchBoards()
      .then((boards) => {
        if (boards.length > 0) setBoardName(boards[0].name)
      })
      .catch(() => {
        setApiError(true)
      })
  }, [])

  return (
    <main className="board-container">
      <header className="board-header">
        <h1 className="board-title">{boardName}</h1>
        {apiError && (
          <p role="status" className="api-error-notice">
            Backend unavailable — showing local data
          </p>
        )}
      </header>
      <div className="board-columns">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            cards={cards.filter((c) => c.columnId === col.id)}
          />
        ))}
      </div>
    </main>
  )
}
