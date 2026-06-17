import * as cardRepository from '../repositories/card.repository';
import { Card, CardColumnId, CreateCardDto } from '../types/card.types';
import { ValidationError } from '../errors/index';

export { ValidationError };

const MAX_TITLE_LENGTH = 100;
const VALID_COLUMN_IDS: CardColumnId[] = ['todo', 'in-progress', 'done'];

export async function getCards(): Promise<Card[]> {
  return cardRepository.getCards();
}

export async function createCard(data: CreateCardDto): Promise<Card> {
  if (!data.title || data.title.trim().length === 0) {
    throw new ValidationError('Title is required and cannot be empty');
  }
  if (data.title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must not exceed ${MAX_TITLE_LENGTH} characters`);
  }
  if (!data.columnId || !VALID_COLUMN_IDS.includes(data.columnId)) {
    throw new ValidationError(`columnId must be one of: ${VALID_COLUMN_IDS.join(', ')}`);
  }
  return cardRepository.createCard({ title: data.title.trim(), columnId: data.columnId });
}

export async function deleteCard(id: string): Promise<void> {
  return cardRepository.deleteCard(id);
}

export async function reorderCard(id: string, position: number): Promise<Card> {
  if (position === undefined || position === null || typeof position !== 'number') {
    throw new ValidationError('position must be a non-negative integer');
  }
  if (!Number.isInteger(position) || position < 0) {
    throw new ValidationError('position must be a non-negative integer');
  }
  return cardRepository.reorderCard(id, position);
}
