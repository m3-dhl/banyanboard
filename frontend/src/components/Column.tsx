import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import type { CardData, ColumnId } from '../types'
import Card from './Card'
import CardForm from './CardForm'

interface Props {
  id: ColumnId
  label: string
  cards: CardData[]
  onAddCard: (columnId: ColumnId, title: string) => void
}

export default function Column({ id, label, cards, onAddCard }: Props) {
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
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            className="column-cards"
            data-testid="drop-area"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {cards.map((card, index) => (
              <Card key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
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
    </section>
  )
}
