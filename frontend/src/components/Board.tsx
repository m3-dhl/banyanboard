import { useEffect, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { COLUMNS, SEED_CARDS } from '../types'
import type { CardData, ColumnId } from '../types'
import { fetchBoards } from '../api'
import Column from './Column'

export default function Board() {
  const [cards, setCards] = useState<CardData[]>(SEED_CARDS)
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

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    setCards((prev) =>
      prev.map((c) =>
        c.id === draggableId ? { ...c, columnId: destination.droppableId as ColumnId } : c
      )
    )
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
    </DragDropContext>
  )
}
