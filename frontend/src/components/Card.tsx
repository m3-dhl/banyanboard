import { Draggable } from '@hello-pangea/dnd'
import type { CardData } from '../types'

interface Props {
  card: CardData
  index: number
}

export default function Card({ card, index }: Props) {
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
        </div>
      )}
    </Draggable>
  )
}
