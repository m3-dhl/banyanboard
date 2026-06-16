export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface Label {
  id: string
  name: string
  color: string // hex, e.g. "#C0392B"
}

export const LABEL_COLORS: { token: string; name: string; hex: string }[] = [
  { token: 'label-red',    name: 'Red',      hex: '#C0392B' },
  { token: 'label-orange', name: 'Orange',   hex: '#D35400' },
  { token: 'label-yellow', name: 'Yellow',   hex: '#9A7D0A' },
  { token: 'label-green',  name: 'Green',    hex: '#1E8449' },
  { token: 'label-teal',   name: 'Teal',     hex: '#148F77' },
  { token: 'label-blue',   name: 'Blue',     hex: '#1A5276' },
  { token: 'label-indigo', name: 'Indigo',   hex: '#4A235A' },
  { token: 'label-purple', name: 'Purple',   hex: '#6C3483' },
  { token: 'label-gray',   name: 'Gray',     hex: '#616A6B' },
  { token: 'label-black',  name: 'Charcoal', hex: '#2C3E50' },
]

export interface CardData {
  id: string
  title: string
  columnId: ColumnId
  labels?: Label[]
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

export type ActivityFeedEntry =
  | { id: string; kind: 'move'; cardTitle: string; fromColumn: ColumnId; toColumn: ColumnId; timestamp: Date }
  | { id: string; kind: 'created'; cardTitle: string; columnId: ColumnId; timestamp: Date }
  | { id: string; kind: 'label-added'; cardTitle: string; labelName: string; timestamp: Date }
  | { id: string; kind: 'label-removed'; cardTitle: string; labelName: string; timestamp: Date }

export const SEED_CARDS: CardData[] = [
  { id: 'card-1', title: 'Design login page', columnId: 'todo' },
  { id: 'card-2', title: 'Implement auth API', columnId: 'in-progress' },
  { id: 'card-3', title: 'Write README', columnId: 'done' },
]
