import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import gameRoutes from './routes/gameRoutes.js';
import authRoutes from './routes/authRoutes.js';

import { seedDefaultStories } from './controllers/gameController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, Postman) or matching allowed origins
    if (!origin || clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Primary API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Fallback aliases if client calls without /api prefix
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);

// Serve static frontend build if present (e.g., single-service Render deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/game') || req.path.startsWith('/auth')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

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