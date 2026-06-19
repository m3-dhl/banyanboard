import { pool } from '../db/pool';
import { Comment } from '../types/comment.types';

function rowToComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    cardId: row.card_id as string,
    body: row.body as string,
    createdAt: row.created_at as Date,
  };
}

export async function getCommentsByCardId(cardId: string): Promise<Comment[]> {
  const result = await pool.query(
    'SELECT id, card_id, body, created_at FROM card_comments WHERE card_id = $1 ORDER BY created_at ASC',
    [cardId],
  );
  return result.rows.map(rowToComment);
}

export async function createComment(cardId: string, body: string): Promise<Comment> {
  const result = await pool.query(
    'INSERT INTO card_comments (card_id, body) VALUES ($1, $2) RETURNING id, card_id, body, created_at',
    [cardId, body.trim()],
  );
  return rowToComment(result.rows[0]);
}
