import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Draggable } from '@hello-pangea/dnd'
import type { CardData, Label } from '../types'
import LabelBadge from './LabelBadge'
import LabelPickerPopover from './LabelPickerPopover'
import DeleteCardDialog from './DeleteCardDialog'

interface Props {
  card: CardData
  index: number
  labels: Label[]
  onLabelToggle: (cardId: string, labelId: string) => void
  onDelete: (cardId: string) => void
}

export default function Card({ card, index, labels, onLabelToggle, onDelete }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const addLabelBtnRef = useRef<HTMLButtonElement>(null)

  const attachedLabelIds = (card.labels ?? []).map((l) => l.id)

  function handleAddLabelClick(): void {
    setShowPicker((prev) => !prev)
  }

  function handleLabelToggle(labelId: string): void {
    onLabelToggle(card.id, labelId)
  }

  function handleManageLabels(): void {
    setShowPicker(false)
  }

  function handlePickerClose(): void {
    setShowPicker(false)
  }

  function handleDeleteClick(): void {
    setShowDeleteDialog(true)
  }

  function handleDeleteConfirm(): void {
    setShowDeleteDialog(false)
    onDelete(card.id)
  }

  function handleDeleteCancel(): void {
    setShowDeleteDialog(false)
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`card${snapshot.isDragging ? ' card--dragging' : ''}`}
          role="article"
          aria-label={card.title}
          tabIndex={0}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <span className="card-title">{card.title}</span>

          {(card.labels ?? []).length > 0 && (
            <div className="card-labels">
              {(card.labels ?? []).map((label) => (
                <LabelBadge key={label.id} label={label} />
              ))}
            </div>
          )}

          <div className="card-footer">
            <button
              ref={addLabelBtnRef}
              type="button"
              className="add-label-btn"
              aria-label={`Add label to ${card.title}`}
              onClick={handleAddLabelClick}
            >
              + Label
            </button>
            <button
              type="button"
              className="delete-card-btn"
              aria-label={`Delete ${card.title}`}
              onClick={handleDeleteClick}
            >
              Delete
            </button>
          </div>

          {showPicker && createPortal(
            <LabelPickerPopover
              labels={labels}
              attachedLabelIds={attachedLabelIds}
              onToggle={handleLabelToggle}
              onManageLabels={handleManageLabels}
              onClose={handlePickerClose}
              anchorRect={addLabelBtnRef.current?.getBoundingClientRect()}
            />,
            document.body
          )}

          {showDeleteDialog && (
            <DeleteCardDialog
              cardTitle={card.title}
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
            />
          )}
        </div>
      )}
    </Draggable>
  )
}
