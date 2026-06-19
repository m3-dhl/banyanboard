import * as cardRepository from '../repositories/card.repository';
import { Card, CardColumnId, CardDetail, CreateCardDto, UpdateCardDto } from '../types/card.types';
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

export async function getCardById(id: string): Promise<CardDetail> {
  return cardRepository.getCardById(id);
}

export async function updateCard(id: string, dto: UpdateCardDto): Promise<CardDetail> {
  if (dto.title !== undefined) {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationError('Title cannot be empty');
    }
    if (dto.title.length > MAX_TITLE_LENGTH) {
      throw new ValidationError(`Title must not exceed ${MAX_TITLE_LENGTH} characters`);
    }
    dto = { ...dto, title: dto.title.trim() };
  }
  if (dto.columnId !== undefined) {
    if (!VALID_COLUMN_IDS.includes(dto.columnId)) {
      throw new ValidationError(`columnId must be one of: ${VALID_COLUMN_IDS.join(', ')}`);
    }
  }
  return cardRepository.updateCard(id, dto);
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
