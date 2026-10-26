import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import gameRoutes from './routes/gameRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/game', gameRoutes);

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(3001, () => console.log('Detective AI Backend running on port 3001'));
  })
  .catch(err => console.error(err));