import { useEffect, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { COLUMNS, SEED_CARDS } from '../types'
import type { ActivityFeedEntry, CardData, ColumnId, Label } from '../types'
import {
  fetchBoards,
  createCard,
  fetchLabels,
  createLabel,
  deleteLabel,
  attachLabel,
  detachLabel,
} from '../api'
import Column from './Column'
import ActivityFeed from './ActivityFeed'
import ThemeToggle from './ThemeToggle'
import FilterBar from './FilterBar'
import LabelManagementPanel from './LabelManagementPanel'

const MAX_FEED_ENTRIES = 20

export default function Board() {
  const [cards, setCards] = useState<CardData[]>(SEED_CARDS)
  const [boardName, setBoardName] = useState<string>('BanyanBoard')
  const [boardId, setBoardId] = useState<string>('')
  const [apiError, setApiError] = useState(false)
  const [feedEntries, setFeedEntries] = useState<ActivityFeedEntry[]>([])
  const [cardCreateError, setCardCreateError] = useState<string | null>(null)
  const [labels, setLabels] = useState<Label[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [labelAssignError, setLabelAssignError] = useState<string | null>(null)
  const [showManagePanel, setShowManagePanel] = useState(false)

  useEffect(() => {
    fetchBoards()
      .then((boards) => {
        if (boards.length > 0) {
          setBoardName(boards[0].name)
          setBoardId(boards[0].id)
          // Non-blocking label fetch once we have the board id
          fetchLabels(boards[0].id)
            .then(setLabels)
            .catch(() => { /* non-blocking */ })
        }
      })
      .catch(() => {
        setApiError(true)
      })
  }, [])

  const filteredCards = activeFilter
    ? cards.filter((c) => (c.labels ?? []).some((l) => l.id === activeFilter))
    : cards

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

  async function onLabelToggle(cardId: string, labelId: string) {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return
    const isAttached = (card.labels ?? []).some((l) => l.id === labelId)
    const labelName = labels.find((l) => l.id === labelId)?.name ?? ''

    setLabelAssignError(null)
    // Optimistic update
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c
        const labelToAdd = labels.find((l) => l.id === labelId)
        return {
          ...c,
          labels: isAttached
            ? (c.labels ?? []).filter((l) => l.id !== labelId)
            : [...(c.labels ?? []), ...(labelToAdd ? [labelToAdd] : [])],
        }
      })
    )

    const feedEntry: ActivityFeedEntry = {
      id: `label-${isAttached ? 'removed' : 'added'}-${cardId}-${labelId}-${Date.now()}`,
      kind: isAttached ? 'label-removed' : 'label-added',
      cardTitle: card.title,
      labelName,
      timestamp: new Date(),
    }
    setFeedEntries((prev) => [feedEntry, ...prev].slice(0, MAX_FEED_ENTRIES))

    try {
      if (isAttached) {
        await detachLabel(cardId, labelId)
      } else {
        await attachLabel(cardId, labelId)
      }
    } catch {
      // Revert optimistic updates
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, labels: card.labels } : c))
      )
      setFeedEntries((prev) => prev.filter((e) => e.id !== feedEntry.id))
      setLabelAssignError('Failed to update label — please try again')
    }
  }

  async function onLabelCreate(name: string, color: string) {
    setLabelAssignError(null)
    try {
      const newLabel = await createLabel(boardId, name, color)
      setLabels((prev) => [...prev, newLabel])
    } catch {
      setLabelAssignError('Failed to create label — please try again')
    }
  }

  async function onLabelDelete(labelId: string) {
    setLabelAssignError(null)
    try {
      await deleteLabel(labelId)
      setLabels((prev) => prev.filter((l) => l.id !== labelId))
      // Remove deleted label from all cards
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          labels: (c.labels ?? []).filter((l) => l.id !== labelId),
        }))
      )
      // Clear active filter if it was the deleted label
      if (activeFilter === labelId) setActiveFilter(null)
    } catch {
      setLabelAssignError('Failed to delete label — please try again')
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <main className="board-container">
        <header className="board-header">
          <h1 className="board-title">{boardName}</h1>
          <ThemeToggle />
          <button
            type="button"
            className="manage-labels-btn"
            onClick={() => setShowManagePanel(true)}
          >
            Manage Labels
          </button>
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
          {labelAssignError && (
            <p role="alert" className="label-assign-error">
              {labelAssignError}
            </p>
          )}
        </header>

        {labels.length > 0 && (
          <FilterBar
            labels={labels}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}

        <div className="board-columns">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              cards={filteredCards.filter((c) => c.columnId === col.id)}
              labels={labels}
              onAddCard={onAddCard}
              onLabelToggle={onLabelToggle}
            />
          ))}
        </div>

        <ActivityFeed entries={feedEntries} />

        {showManagePanel && (
          <LabelManagementPanel
            labels={labels}
            onCreate={onLabelCreate}
            onDelete={onLabelDelete}
            onClose={() => setShowManagePanel(false)}
          />
        )}
      </main>
    </DragDropContext>
  )
}
