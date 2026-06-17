import { Request, Response } from 'express';
import * as cardService from '../services/card.service';
import { ValidationError } from '../services/card.service';
import { NotFoundError } from '../errors/index';

export async function getCards(_req: Request, res: Response): Promise<void> {
  try {
    const cards = await cardService.getCards();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardService.createCard({
      title: req.body.title,
      columnId: req.body.columnId,
    });
    res.status(201).json(card);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderCardPosition(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { position } = req.body;
    const card = await cardService.reorderCard(id, position);
    res.json(card);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
