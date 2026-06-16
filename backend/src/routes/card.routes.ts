import { Router } from 'express';
import { createCard, getCards } from '../controllers/card.controller';
import { attachLabel, detachLabel } from '../controllers/label.controller';

const router = Router();

router.get('/', getCards);
router.post('/', createCard);
router.post('/:id/labels', attachLabel);
router.delete('/:id/labels/:labelId', detachLabel);

export default router;
