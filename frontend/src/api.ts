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
