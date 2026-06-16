import { Router } from 'express';
import { createCard } from '../controllers/card.controller';

const router = Router();

router.post('/', createCard);

export default router;
