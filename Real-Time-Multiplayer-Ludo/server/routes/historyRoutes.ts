import express from 'express';
import { getHistory } from '../controllers/historyController.ts';

const router = express.Router();
router.get('/:username', getHistory);

export default router;