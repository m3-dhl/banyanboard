import * as cardRepository from '../repositories/card.repository';
import { Card, CardColumnId, CreateCardDto } from '../types/card.types';

const MAX_TITLE_LENGTH = 100;
const VALID_COLUMN_IDS: CardColumnId[] = ['todo', 'in-progress', 'done'];

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
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
