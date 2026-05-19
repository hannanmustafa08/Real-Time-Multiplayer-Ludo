import express from 'express';
import { signup, login, updateProfile } from '../controllers/authController.ts';


const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/update', updateProfile);

export default router;