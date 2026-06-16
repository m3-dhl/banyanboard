import { pool } from '../db/pool';
import { Board, CreateBoardDto, UpdateBoardDto } from '../types/board.types';

function rowToBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    title: row.title as string,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export async function getBoards(): Promise<Board[]> {
  const result = await pool.query(
    'SELECT id, title, created_at, updated_at FROM boards ORDER BY created_at DESC',
  );
  return result.rows.map(rowToBoard);
}

export async function getBoardById(id: string): Promise<Board | null> {
  const result = await pool.query(
    'SELECT id, title, created_at, updated_at FROM boards WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return rowToBoard(result.rows[0]);
}

export async function createBoard(data: CreateBoardDto): Promise<Board> {
  const result = await pool.query(
    'INSERT INTO boards (title) VALUES ($1) RETURNING id, title, created_at, updated_at',
    [data.title],
  );
  return rowToBoard(result.rows[0]);
}

export async function updateBoard(
  id: string,
  data: UpdateBoardDto,
): Promise<Board | null> {
  const result = await pool.query(
    `UPDATE boards
     SET title = COALESCE($2, title), updated_at = NOW()
     WHERE id = $1
     RETURNING id, title, created_at, updated_at`,
    [id, data.title ?? null],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return rowToBoard(result.rows[0]);
}

export async function deleteBoard(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM boards WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
