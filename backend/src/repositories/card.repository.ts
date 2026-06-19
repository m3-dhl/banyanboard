import { pool } from '../db/pool';
import { Card, CardDetail, CreateCardDto, UpdateCardDto } from '../types/card.types';
import { LabelSummary } from '../types/label.types';
import { NotFoundError } from '../errors/index';

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    title: row.title as string,
    columnId: row.column_id as Card['columnId'],
    position: row.position as number,
    createdAt: row.created_at as Date,
    labels: (row.labels as LabelSummary[]) ?? [],
  };
}

const CARD_WITH_LABELS_QUERY = `
  SELECT
    c.id,
    c.title,
    c.column_id,
    c.position,
    c.created_at,
    c.description,
    c.due_date,
    COALESCE(
      json_agg(
        json_build_object('id', l.id, 'name', l.name, 'color', l.color)
        ORDER BY l.name
      ) FILTER (WHERE l.id IS NOT NULL),
      '[]'::json
    ) AS labels
  FROM cards c
  LEFT JOIN card_labels cl ON cl.card_id = c.id
  LEFT JOIN labels l       ON l.id = cl.label_id
`;

export async function getCards(): Promise<Card[]> {
  const result = await pool.query(`
    ${CARD_WITH_LABELS_QUERY}
    GROUP BY c.id
    ORDER BY c.position ASC, c.created_at ASC
  `);
  return result.rows.map(rowToCard);
}

export async function createCard(data: CreateCardDto): Promise<Card> {
  // Insert at end of column: position = count of existing cards in column
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM cards WHERE column_id = $1',
    [data.columnId],
  );
  const position = parseInt(countResult.rows[0].count as string, 10);

  const result = await pool.query(
    'INSERT INTO cards (title, column_id, position) VALUES ($1, $2, $3) RETURNING id, title, column_id, position, created_at',
    [data.title, data.columnId, position],
  );
  return { ...rowToCard(result.rows[0]), labels: [] };
}

export async function deleteCard(id: string): Promise<void> {
  const result = await pool.query('DELETE FROM cards WHERE id = $1', [id]);
  if ((result.rowCount ?? 0) === 0) {
    throw new NotFoundError(`Card not found: ${id}`);
  }
}

function rowToCardDetail(row: Record<string, unknown>): CardDetail {
  const base = rowToCard(row);
  return {
    ...base,
    description: (row.description as string | null) ?? null,
    dueDate:
      row.due_date instanceof Date
        ? (row.due_date as Date).toISOString().slice(0, 10)
        : (row.due_date as string | null) ?? null,
  };
}

export async function getCardById(id: string): Promise<CardDetail> {
  const result = await pool.query(
    `${CARD_WITH_LABELS_QUERY} WHERE c.id = $1 GROUP BY c.id`,
    [id],
  );
  if (result.rows.length === 0) {
    throw new NotFoundError(`Card not found: ${id}`);
  }
  return rowToCardDetail(result.rows[0]);
}

export async function updateCard(id: string, dto: UpdateCardDto): Promise<CardDetail> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(dto.title);
  }
  if (dto.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(dto.description);
  }
  if (dto.dueDate !== undefined) {
    fields.push(`due_date = $${idx++}`);
    values.push(dto.dueDate);
  }
  if (dto.columnId !== undefined) {
    fields.push(`column_id = $${idx++}`);
    values.push(dto.columnId);
  }

  if (fields.length === 0) {
    return getCardById(id);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE cards SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
    values,
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new NotFoundError(`Card not found: ${id}`);
  }
  return getCardById(id);
}

export async function reorderCard(id: string, newPosition: number): Promise<Card> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cardResult = await client.query(
      'SELECT id, column_id FROM cards WHERE id = $1',
      [id],
    );
    if (cardResult.rows.length === 0) {
      throw new NotFoundError(`Card not found: ${id}`);
    }
    const columnId = cardResult.rows[0].column_id as string;

    const columnResult = await client.query(
      'SELECT id FROM cards WHERE column_id = $1 ORDER BY position ASC, created_at ASC',
      [columnId],
    );
    const ids: string[] = columnResult.rows.map((r: Record<string, unknown>) => r.id as string);

    const currentIdx = ids.indexOf(id);
    ids.splice(currentIdx, 1);
    const clampedPos = Math.max(0, Math.min(newPosition, ids.length));
    ids.splice(clampedPos, 0, id);

    for (let i = 0; i < ids.length; i++) {
      await client.query('UPDATE cards SET position = $1 WHERE id = $2', [i, ids[i]]);
    }

    await client.query('COMMIT');

    const result = await pool.query(`
      ${CARD_WITH_LABELS_QUERY}
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    return rowToCard(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
