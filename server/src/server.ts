import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import gameRoutes from './routes/gameRoutes';

import { seedDefaultStories } from './controllers/gameController';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/game', gameRoutes);

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI as string)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      await seedDefaultStories();
    } catch (seedErr) {
      console.error('Error auto-seeding stories:', seedErr);
    }
    app.listen(PORT, () => console.log(`Detective AI Backend running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });