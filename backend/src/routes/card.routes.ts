import { Router } from 'express';
import { createCard, deleteCard, getCards, reorderCardPosition } from '../controllers/card.controller';
import { attachLabel, detachLabel } from '../controllers/label.controller';

const router = Router();

router.get('/', getCards);
router.post('/', createCard);
router.delete('/:id', deleteCard);
router.patch('/:id/position', reorderCardPosition);
router.post('/:id/labels', attachLabel);
router.delete('/:id/labels/:labelId', detachLabel);

export default router;
