import { pool } from '../db/pool';
import { Card, CreateCardDto } from '../types/card.types';
import { LabelSummary } from '../types/label.types';

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    title: row.title as string,
    columnId: row.column_id as Card['columnId'],
    createdAt: row.created_at as Date,
    labels: (row.labels as LabelSummary[]) ?? [],
  };
}

export async function getCards(): Promise<Card[]> {
  const result = await pool.query(`
    SELECT
      c.id,
      c.title,
      c.column_id,
      c.created_at,
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
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  return result.rows.map(rowToCard);
}

export async function createCard(data: CreateCardDto): Promise<Card> {
  const result = await pool.query(
    'INSERT INTO cards (title, column_id) VALUES ($1, $2) RETURNING id, title, column_id, created_at',
    [data.title, data.columnId],
  );
  return { ...rowToCard(result.rows[0]), labels: [] };
}
