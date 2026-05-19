import type { Request, Response } from 'express';
import User from '../models/User.ts';

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const players = await User.find()
      .sort({ coins: -1, total_played: 1 })
      .select('username coins total_played'); 

    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error });
  }
};