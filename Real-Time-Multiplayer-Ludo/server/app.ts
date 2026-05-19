import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import statsRoutes from './routes/statsRoutes.ts';
import historyRoutes from './routes/historyRoutes.ts';


export const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/history', historyRoutes);