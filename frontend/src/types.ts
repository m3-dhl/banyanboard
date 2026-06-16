export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface CardData {
  id: string
  title: string
  columnId: ColumnId
}

export interface ColumnData {
  id: ColumnId
  label: string
}

export const COLUMNS: ColumnData[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export interface ActivityFeedEntry {
  id: string
  cardTitle: string
  fromColumn: ColumnId
  toColumn: ColumnId
  timestamp: Date
}

export const SEED_CARDS: CardData[] = [
  { id: 'card-1', title: 'Design login page', columnId: 'todo' },
  { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress' },
  { id: 'card-3', title: 'Write README', columnId: 'done' },
]
