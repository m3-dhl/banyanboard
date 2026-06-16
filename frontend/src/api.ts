import type { CardData, ColumnId } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001'

export interface Board {
  id: string
  name: string
}

export async function fetchBoards(): Promise<Board[]> {
  const res = await fetch(`${API_BASE}/boards`)
  if (!res.ok) throw new Error(`GET /boards failed: ${res.status}`)
  const data = await res.json() as { id: string; title: string }[]
  return data.map((b) => ({ id: b.id, name: b.title }))
}

export async function createCard(title: string, columnId: ColumnId): Promise<CardData> {
  const res = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, columnId }),
  })
  if (!res.ok) throw new Error(`POST /cards failed: ${res.status}`)
  const data = await res.json() as { id: string; title: string; columnId: string }
  return { id: data.id, title: data.title, columnId: data.columnId as ColumnId }
}
