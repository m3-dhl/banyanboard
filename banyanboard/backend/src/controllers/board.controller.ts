import { Request, Response } from 'express';
import * as boardService from '../services/board.service';
import { ValidationError } from '../services/board.service';

export async function getBoards(_req: Request, res: Response): Promise<void> {
  try {
    const boards = await boardService.getBoards();
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBoardById(req: Request, res: Response): Promise<void> {
  try {
    const board = await boardService.getBoardById(req.params.id);
    if (board === null) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createBoard(req: Request, res: Response): Promise<void> {
  try {
    const board = await boardService.createBoard({ title: req.body.title });
    res.status(201).json(board);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateBoard(req: Request, res: Response): Promise<void> {
  try {
    const board = await boardService.updateBoard(req.params.id, {
      title: req.body.title,
    });
    if (board === null) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }
    res.json(board);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteBoard(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await boardService.deleteBoard(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
