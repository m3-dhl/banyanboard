import { pool } from '../db/pool';
import { Label, CreateLabelDto } from '../types/label.types';
import { NotFoundError, ValidationError, ConflictError } from '../errors/index';

function rowToLabel(row: Record<string, unknown>): Label {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    boardId: row.board_id as string,
    createdAt: row.created_at as Date,
  };
}

export async function createLabel(data: CreateLabelDto): Promise<Label> {
  try {
    const result = await pool.query(
      'INSERT INTO labels (name, color, board_id) VALUES ($1, $2, $3) RETURNING id, name, color, board_id, created_at',
      [data.name, data.color, data.boardId],
    );
    return rowToLabel(result.rows[0]);
  } catch (err) {
    const pgErr = err as { code?: string; message?: string };
    if (pgErr.code === '23503') {
      throw new NotFoundError('Board not found');
    }
    if (pgErr.code === '23505') {
      throw new ValidationError('A label with this name already exists on this board');
    }
    throw err;
  }
}

export async function getLabelsByBoard(boardId: string): Promise<Label[]> {
  const result = await pool.query(
    'SELECT id, name, color, board_id, created_at FROM labels WHERE board_id = $1 ORDER BY name',
    [boardId],
  );
  return result.rows.map(rowToLabel);
}

export async function getLabelById(id: string): Promise<Label | null> {
  const result = await pool.query(
    'SELECT id, name, color, board_id, created_at FROM labels WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) return null;
  return rowToLabel(result.rows[0]);
}

export async function deleteLabel(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM labels WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function attachLabelToCard(
  cardId: string,
  labelId: string,
): Promise<{ cardId: string; labelId: string }> {
  try {
    await pool.query(
      'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)',
      [cardId, labelId],
    );
    return { cardId, labelId };
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23503') {
      throw new NotFoundError('Card or label not found');
    }
    if (pgErr.code === '23505') {
      throw new ConflictError('Label already attached to this card');
    }
    throw err;
  }
}

export async function detachLabelFromCard(cardId: string, labelId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2 RETURNING card_id',
    [cardId, labelId],
  );
  return result.rowCount !== null && result.rowCount > 0;
}
