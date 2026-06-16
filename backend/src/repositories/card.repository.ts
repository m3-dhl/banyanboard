import { pool } from '../db/pool';
import { Card, CreateCardDto } from '../types/card.types';

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    title: row.title as string,
    columnId: row.column_id as Card['columnId'],
    createdAt: row.created_at as Date,
  };
}

export async function createCard(data: CreateCardDto): Promise<Card> {
  const result = await pool.query(
    'INSERT INTO cards (title, column_id) VALUES ($1, $2) RETURNING id, title, column_id, created_at',
    [data.title, data.columnId],
  );
  return rowToCard(result.rows[0]);
}
