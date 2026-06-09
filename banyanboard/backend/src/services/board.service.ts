import * as boardRepository from '../repositories/board.repository';
import { Board, CreateBoardDto, UpdateBoardDto } from '../types/board.types';

const MAX_TITLE_LENGTH = 100;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Title is required and cannot be empty');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must not exceed ${MAX_TITLE_LENGTH} characters`);
  }
}

export async function getBoards(): Promise<Board[]> {
  return boardRepository.getBoards();
}

export async function getBoardById(id: string): Promise<Board | null> {
  return boardRepository.getBoardById(id);
}

export async function createBoard(data: CreateBoardDto): Promise<Board> {
  validateTitle(data.title);
  return boardRepository.createBoard(data);
}

export async function updateBoard(
  id: string,
  data: UpdateBoardDto,
): Promise<Board | null> {
  if (data.title === undefined) {
    throw new ValidationError('Request body must include at least one field to update');
  }
  validateTitle(data.title);
  return boardRepository.updateBoard(id, data);
}

export async function deleteBoard(id: string): Promise<boolean> {
  return boardRepository.deleteBoard(id);
}
