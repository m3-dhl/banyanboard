import * as labelRepository from '../repositories/label.repository';
import { Label, CreateLabelDto } from '../types/label.types';
import { ValidationError, NotFoundError, ConflictError } from '../errors/index';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const MAX_NAME_LENGTH = 50;

export async function createLabel(data: CreateLabelDto): Promise<Label> {
  if (!data.name || data.name.trim().length === 0) {
    throw new ValidationError('name is required and cannot be empty');
  }
  if (data.name.trim().length > MAX_NAME_LENGTH) {
    throw new ValidationError(`name must not exceed ${MAX_NAME_LENGTH} characters`);
  }
  if (!data.color || !HEX_COLOR_REGEX.test(data.color)) {
    throw new ValidationError('color must be a valid hex color (e.g. #C0392B)');
  }
  if (!data.boardId) {
    throw new ValidationError('boardId is required');
  }

  const normalizedColor = data.color.toLowerCase();
  const trimmedName = data.name.trim();

  const existing = await labelRepository.getLabelsByBoard(data.boardId);
  if (existing && existing.some((l) => l.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new ValidationError('A label with this name already exists on this board');
  }

  return labelRepository.createLabel({
    name: trimmedName,
    color: normalizedColor,
    boardId: data.boardId,
  });
}

export async function getLabelsByBoard(boardId: string): Promise<Label[]> {
  if (!boardId) throw new ValidationError('boardId is required');
  return labelRepository.getLabelsByBoard(boardId);
}

export async function deleteLabel(id: string): Promise<boolean> {
  return labelRepository.deleteLabel(id);
}

export async function attachLabel(
  cardId: string,
  labelId: string,
): Promise<{ cardId: string; labelId: string }> {
  if (!labelId) throw new ValidationError('labelId is required');
  return labelRepository.attachLabelToCard(cardId, labelId);
}

export async function detachLabel(cardId: string, labelId: string): Promise<boolean> {
  return labelRepository.detachLabelFromCard(cardId, labelId);
}

// Re-export error classes so controllers can reference them if needed
export { ValidationError, NotFoundError, ConflictError };
