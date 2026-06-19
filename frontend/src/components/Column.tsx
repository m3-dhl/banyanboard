import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import type { CardData, ColumnId, Label } from '../types'
import Card from './Card'
import CardForm from './CardForm'

interface Props {
  id: ColumnId
  label: string
  cards: CardData[]
  labels: Label[]
  onAddCard: (columnId: ColumnId, title: string) => void
  onLabelToggle: (cardId: string, labelId: string) => void
  onDeleteCard: (cardId: string) => void
  onOpenDetail: (cardId: string) => void
}

export default function Column({ id, label, cards, labels, onAddCard, onLabelToggle, onDeleteCard, onOpenDetail }: Props) {
  const [formOpen, setFormOpen] = useState(false)

  function handleAdd(title: string) {
    onAddCard(id, title)
    setFormOpen(false)
  }

  return (
    <section
      className="column"
      role="region"
      aria-label={label}
      data-column-id={id}
    >
      <h2 className="column-header">{label}</h2>
      {formOpen ? (
        <CardForm columnId={id} onAdd={handleAdd} onCancel={() => setFormOpen(false)} />
      ) : (
        <button
          type="button"
          className="add-card-btn"
          aria-label="Add card"
          onClick={() => setFormOpen(true)}
        >
          Add card
        </button>
      )}
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            className="column-cards"
            data-testid="drop-area"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {cards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                index={index}
                labels={labels}
                onLabelToggle={onLabelToggle}
                onDelete={onDeleteCard}
                onOpenDetail={onOpenDetail}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  )
}
