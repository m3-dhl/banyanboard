import type { CardData } from '../types'

interface Props {
  card: CardData
}

export default function Card({ card }: Props) {
  return (
    <div
      className="card"
      role="article"
      aria-label={card.title}
      tabIndex={0}
    >
      <span className="card-title">{card.title}</span>
    </div>
  )
}
