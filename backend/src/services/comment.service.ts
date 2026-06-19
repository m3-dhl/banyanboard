import * as cardRepository from '../repositories/card.repository';
import * as commentRepository from '../repositories/comment.repository';
import { Comment } from '../types/comment.types';
import { ValidationError } from '../errors/index';

const MAX_COMMENT_LENGTH = 500;

export async function getComments(cardId: string): Promise<Comment[]> {
  await cardRepository.getCardById(cardId);
  return commentRepository.getCommentsByCardId(cardId);
}

export async function createComment(cardId: string, body: string): Promise<Comment> {
  await cardRepository.getCardById(cardId);
  if (!body || body.trim().length === 0) {
    throw new ValidationError('Comment body is required and cannot be empty');
  }
  if (body.trim().length > MAX_COMMENT_LENGTH) {
    throw new ValidationError(`Comment body must not exceed ${MAX_COMMENT_LENGTH} characters`);
  }
  return commentRepository.createComment(cardId, body.trim());
}
