import type { Request, Response } from 'express';
import User from '../models/User.ts';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, dob } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }

    const newUser = new User({
      username,
      password,
      dob
    });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.password !== password) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    res.status(200).json({
      message: 'Login successful',
      token: user._id.toString(),
      user: {
        username: user.username,
        coins: user.coins
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

//UPDATE PROFILE LOGIC
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, dob, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    //  verify the old pwd first before changing
    if (newPassword) {
      if (user.password !== currentPassword) {
        res.status(400).json({ message: 'Incorrect current password' });
        return;
      }
      user.password = newPassword;
    }

    //  update dob
    user.dob = dob;
    await user.save();

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};