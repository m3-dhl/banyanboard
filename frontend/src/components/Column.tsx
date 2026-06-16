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
      <div className="column-cards" data-testid="drop-area">
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}
