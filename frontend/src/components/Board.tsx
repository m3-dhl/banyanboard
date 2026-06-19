import { useEffect, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { COLUMNS, SEED_CARDS } from '../types'
import type { ActivityFeedEntry, CardData, ColumnId, Label } from '../types'
import {
  fetchBoards,
  fetchCards,
  createCard,
  fetchLabels,
  createLabel,
  deleteLabel,
  attachLabel,
  detachLabel,
  reorderCard,
  deleteCard,
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
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [labelAssignError, setLabelAssignError] = useState<string | null>(null)
  const [cardDeleteError, setCardDeleteError] = useState<string | null>(null)
  const [showManagePanel, setShowManagePanel] = useState(false)

  useEffect(() => {
    Promise.all([fetchBoards(), fetchCards()])
      .then(([boards, dbCards]) => {
        // Only replace seed cards; never overwrite a user interaction that raced the fetch
        setCards((prev) => (prev === SEED_CARDS ? dbCards : prev))
        if (boards.length > 0) {
          setBoardName(boards[0].name)
          setBoardId(boards[0].id)
          fetchLabels(boards[0].id)
            .then(setLabels)
            .catch(() => { /* non-blocking */ })
        }
      })
      .catch(() => {
        setApiError(true)
      })
  }, [])

  const filteredCards = activeFilters.length > 0
    ? cards.filter((c) => (c.labels ?? []).some((l) => activeFilters.includes(l.id)))
    : cards

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Same-column reorder: optimistic update + persist + revert on failure
    if (destination.droppableId === source.droppableId) {
      const colId = source.droppableId as ColumnId
      const snapshot = cards

      // Use filteredCards to get the rendered order (handles active filter correctly)
      const visibleColCards = filteredCards.filter((c) => c.columnId === colId)
      const reordered = [...visibleColCards]
      const [dragged] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, dragged)

      const visibleIdSet = new Set(visibleColCards.map((c) => c.id))

      setCards((prev) => {
        const hiddenColCards = prev.filter((c) => c.columnId === colId && !visibleIdSet.has(c.id))
        const otherCards = prev.filter((c) => c.columnId !== colId)
        return [...otherCards, ...reordered, ...hiddenColCards]
      })

      reorderCard(draggableId, destination.index).catch(() => {
        setCards(snapshot)
        setCardCreateError('Failed to reorder card — please try again')
      })

      return
    }

    // Cross-column move: insert at destination.index within target column + activity feed entry
    const movedCard = cards.find((c) => c.id === draggableId)
    if (!movedCard) return

    const entry: ActivityFeedEntry = {
      id: `${draggableId}-${Date.now()}`,
      kind: 'move',
      cardTitle: movedCard.title,
      fromColumn: source.droppableId as ColumnId,
      toColumn: destination.droppableId as ColumnId,
      timestamp: new Date(),
    }
    setFeedEntries((prev) => [entry, ...prev].slice(0, MAX_FEED_ENTRIES))

    setCards((prev) => {
      const withoutMoved = prev.filter((c) => c.id !== draggableId)
      const updatedCard = { ...movedCard, columnId: destination.droppableId as ColumnId }
      const destCards = withoutMoved.filter((c) => c.columnId === destination.droppableId)
      const nonDestCards = withoutMoved.filter((c) => c.columnId !== destination.droppableId)
      const newDestCards = [
        ...destCards.slice(0, destination.index),
        updatedCard,
        ...destCards.slice(destination.index),
      ]
      return [...nonDestCards, ...newDestCards]
    })
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

  async function onDeleteCard(cardId: string) {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    const entry: ActivityFeedEntry = {
      id: `deleted-${cardId}-${Date.now()}`,
      kind: 'deleted',
      cardTitle: card.title,
      timestamp: new Date(),
    }

    setCards((prev) => prev.filter((c) => c.id !== cardId))
    setFeedEntries((prev) => [entry, ...prev].slice(0, MAX_FEED_ENTRIES))
    setCardDeleteError(null)

    try {
      await deleteCard(cardId)
    } catch {
      setCards((prev) => [...prev, card])
      setFeedEntries((prev) => prev.filter((e) => e.id !== entry.id))
      setCardDeleteError('Failed to delete card — please try again')
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
      // Remove deleted label from active filters if present
      setActiveFilters((prev) => prev.filter((id) => id !== labelId))
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
          {cardDeleteError && (
            <p role="alert" className="card-delete-error">
              {cardDeleteError}
            </p>
          )}
        </header>

        {labels.length > 0 && (
          <FilterBar
            labels={labels}
            activeFilters={activeFilters}
            onFilterChange={(labelId) =>
              setActiveFilters((prev) =>
                prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
              )
            }
            onFilterClear={() => setActiveFilters([])}
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
              onDeleteCard={onDeleteCard}
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
