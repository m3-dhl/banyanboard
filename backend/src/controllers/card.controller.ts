import { Request, Response } from 'express';
import * as cardService from '../services/card.service';
import { ValidationError } from '../services/card.service';

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
