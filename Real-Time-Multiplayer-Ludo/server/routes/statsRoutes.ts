import express from 'express';
import { getLeaderboard } from '../controllers/statsController.ts';

const router = express.Router();
router.get('/leaderboard', getLeaderboard);
export default router;