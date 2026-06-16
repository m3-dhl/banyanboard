import { Request, Response } from 'express';
import * as labelService from '../services/label.service';
import { ValidationError, NotFoundError, ConflictError } from '../errors/index';

function isValidationError(err: unknown): boolean {
  return (
    err instanceof ValidationError ||
    (err instanceof Error && err.name === 'ValidationError')
  );
}

function isNotFoundError(err: unknown): boolean {
  return (
    err instanceof NotFoundError ||
    (err instanceof Error && err.name === 'NotFoundError')
  );
}

function isConflictError(err: unknown): boolean {
  return (
    err instanceof ConflictError ||
    (err instanceof Error && err.name === 'ConflictError')
  );
}

export async function createLabel(req: Request, res: Response): Promise<void> {
  try {
    const label = await labelService.createLabel({
      name: req.body.name,
      color: req.body.color,
      boardId: req.body.boardId,
    });
    res.status(201).json(label);
  } catch (err) {
    if (isValidationError(err)) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    if (isNotFoundError(err)) {
      res.status(404).json({ error: (err as Error).message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listLabels(req: Request, res: Response): Promise<void> {
  try {
    const labels = await labelService.getLabelsByBoard(req.query.boardId as string);
    res.json(labels);
  } catch (err) {
    if (isValidationError(err)) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteLabel(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await labelService.deleteLabel(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Label not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function attachLabel(req: Request, res: Response): Promise<void> {
  try {
    const result = await labelService.attachLabel(req.params.id, req.body.labelId);
    res.status(201).json(result);
  } catch (err) {
    if (isValidationError(err)) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    if (isNotFoundError(err)) {
      res.status(404).json({ error: (err as Error).message });
      return;
    }
    if (isConflictError(err)) {
      res.status(409).json({ error: (err as Error).message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function detachLabel(req: Request, res: Response): Promise<void> {
  try {
    const detached = await labelService.detachLabel(req.params.id, req.params.labelId);
    if (!detached) {
      res.status(404).json({ error: 'Label association not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
