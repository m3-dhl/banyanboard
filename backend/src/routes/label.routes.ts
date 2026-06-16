import { Router } from 'express';
import { createLabel, listLabels, deleteLabel } from '../controllers/label.controller';

const router = Router();

router.post('/', createLabel);
router.get('/', listLabels);
router.delete('/:id', deleteLabel);

export default router;
