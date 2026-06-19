import { Request, Response } from 'express';
import * as commentService from '../services/comment.service';
import { ValidationError, NotFoundError } from '../errors/index';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getComments(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid card ID format' });
    return;
  }
  try {
    const comments = await commentService.getComments(id);
    res.json(comments);
  } catch (err) {
    if (err instanceof NotFoundError || (err as Error).name === 'NotFoundError') {
      res.status(404).json({ error: (err as Error).message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'Invalid card ID format' });
    return;
  }
  try {
    const comment = await commentService.createComment(id, req.body.body ?? '');
    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    if (err instanceof NotFoundError || (err as Error).name === 'NotFoundError') {
      res.status(404).json({ error: (err as Error).message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
