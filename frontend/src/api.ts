import type { CardData, ColumnId, Label } from './types'

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

export async function fetchCards(): Promise<CardData[]> {
  const res = await fetch(`${API_BASE}/cards`)
  if (!res.ok) throw new Error(`GET /cards failed: ${res.status}`)
  const data = await res.json() as { id: string; title: string; columnId: string; labels?: Label[] }[]
  return data.map((c) => ({
    id: c.id,
    title: c.title,
    columnId: c.columnId as ColumnId,
    labels: c.labels ?? [],
  }))
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

export async function fetchLabels(boardId: string): Promise<Label[]> {
  const encodedBoardId = encodeURIComponent(boardId)
  const res = await fetch(`${API_BASE}/labels?boardId=${encodedBoardId}`)
  if (!res.ok) throw new Error(`GET /labels?boardId=${encodedBoardId} failed: ${res.status}`)
  return res.json() as Promise<Label[]>
}

export async function createLabel(boardId: string, name: string, color: string): Promise<Label> {
  const res = await fetch(`${API_BASE}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color, boardId }),
  })
  if (!res.ok) throw new Error(`POST /labels failed: ${res.status}`)
  return res.json() as Promise<Label>
}

export async function deleteLabel(labelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/labels/${labelId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /labels/${labelId} failed: ${res.status}`)
}

export async function attachLabel(cardId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cards/${cardId}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  })
  if (!res.ok) throw new Error(`POST /cards/${cardId}/labels failed: ${res.status}`)
}

export async function detachLabel(cardId: string, labelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /cards/${cardId}/labels/${labelId} failed: ${res.status}`)
}

export async function deleteCard(cardId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /cards/${cardId} failed: ${res.status}`)
}

export async function reorderCard(cardId: string, position: number): Promise<void> {
  const res = await fetch(`${API_BASE}/cards/${cardId}/position`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position }),
  })
  if (!res.ok) throw new Error(`PATCH /cards/${cardId}/position failed: ${res.status}`)
}
