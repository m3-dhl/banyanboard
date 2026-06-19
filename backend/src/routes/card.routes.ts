import { Router } from 'express';
import {
  createCard,
  deleteCard,
  getCards,
  getCardById,
  updateCard,
  reorderCardPosition,
} from '../controllers/card.controller';
import { attachLabel, detachLabel } from '../controllers/label.controller';
import { getComments, createComment } from '../controllers/comment.controller';

const router = Router();

router.get('/', getCards);
router.post('/', createCard);
router.get('/:id', getCardById);
router.patch('/:id/position', reorderCardPosition);
router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);
router.post('/:id/labels', attachLabel);
router.delete('/:id/labels/:labelId', detachLabel);
router.get('/:id/comments', getComments);
router.post('/:id/comments', createComment);

export default router;
