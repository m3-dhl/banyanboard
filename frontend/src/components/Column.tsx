import { Droppable } from '@hello-pangea/dnd'
import type { CardData, ColumnId } from '../types'
import Card from './Card'

interface Props {
  id: ColumnId
  label: string
  cards: CardData[]
}

export default function Column({ id, label, cards }: Props) {
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
    </section>
  )
}
