import { Router } from 'express';
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/board.controller';

const router = Router();

router.get('/', getBoards);
router.get('/:id', getBoardById);
router.post('/', createBoard);
router.patch('/:id', updateBoard);
router.delete('/:id', deleteBoard);

export default router;
