import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import gameRoutes from './routes/gameRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; // Added chat routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

await connectDB();

app.use('/api/game', gameRoutes);
app.use('/api/chat', chatRoutes); // Mounted chat routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', stage: 'Backend controllers complete' });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});