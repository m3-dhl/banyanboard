import { useEffect, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { COLUMNS, SEED_CARDS } from '../types'
import type { ActivityFeedEntry, CardData, ColumnId } from '../types'
import { fetchBoards, createCard } from '../api'
import Column from './Column'
import ActivityFeed from './ActivityFeed'

const MAX_FEED_ENTRIES = 20

export default function Board() {
  const [cards, setCards] = useState<CardData[]>(SEED_CARDS)
  const [boardName, setBoardName] = useState<string>('BanyanBoard')
  const [apiError, setApiError] = useState(false)
  const [feedEntries, setFeedEntries] = useState<ActivityFeedEntry[]>([])
  const [cardCreateError, setCardCreateError] = useState<string | null>(null)

  useEffect(() => {
    fetchBoards()
      .then((boards) => {
        if (boards.length > 0) setBoardName(boards[0].name)
      })
      .catch(() => {
        setApiError(true)
      })
  }, [])

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (destination.droppableId !== source.droppableId) {
      const movedCard = cards.find((c) => c.id === draggableId)
      if (movedCard) {
        const entry: ActivityFeedEntry = {
          id: `${draggableId}-${Date.now()}`,
          kind: 'move',
          cardTitle: movedCard.title,
          fromColumn: source.droppableId as ColumnId,
          toColumn: destination.droppableId as ColumnId,
          timestamp: new Date(),
        }
        setFeedEntries((prev) => [entry, ...prev].slice(0, MAX_FEED_ENTRIES))
      }
    }

    setCards((prev) =>
      prev.map((c) =>
        c.id === draggableId ? { ...c, columnId: destination.droppableId as ColumnId } : c
      )
    )
  }

  async function onAddCard(columnId: ColumnId, title: string) {
    const newCard: CardData = {
      id: crypto.randomUUID(),
      title,
      columnId,
    }
    const entry: ActivityFeedEntry = {
      id: `created-${newCard.id}`,
      kind: 'created',
      cardTitle: title,
      columnId,
      timestamp: new Date(),
    }

    setCards((prev) => [...prev, newCard])
    setFeedEntries((prev) => [entry, ...prev].slice(0, MAX_FEED_ENTRIES))
    setCardCreateError(null)

    try {
      await createCard(title, columnId)
    } catch {
      setCards((prev) => prev.filter((c) => c.id !== newCard.id))
      setFeedEntries((prev) => prev.filter((e) => e.id !== entry.id))
      setCardCreateError('Failed to save card — please try again')
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <main className="board-container">
        <header className="board-header">
          <h1 className="board-title">{boardName}</h1>
          {apiError && (
            <p role="status" className="api-error-notice">
              Backend unavailable — showing local data
            </p>
          )}
          {cardCreateError && (
            <p role="alert" className="card-create-error">
              {cardCreateError}
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
              onAddCard={onAddCard}
            />
          ))}
        </div>
        <ActivityFeed entries={feedEntries} />
      </main>
    </DragDropContext>
  )
}
