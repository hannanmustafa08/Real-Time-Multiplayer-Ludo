import type { Request, Response } from 'express';
import Game from '../models/Game.ts';

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.params.username;
    const games = await Game.find({ players: username }).sort({ date: -1 });
    
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error });
  }
};