import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}
import gameRoutes from './routes/gameRoutes.js';
import authRoutes from './routes/authRoutes.js';

import { seedDefaultStories } from './controllers/gameController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(url => url.trim());
const additionalConnectSources = (process.env.CSP_CONNECT_SRC || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", ...additionalConnectSources],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Primary API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Fallback aliases if client calls without /api prefix
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);

// Welcome message on /api
app.get('/api', (_req, res) => {
  res.json({
    message: 'Welcome to HelloDetective!',
    status: 'online',
    endpoints: {
      game: '/api/game',
      auth: '/api/auth'
    }
  });
});

// Serve static frontend build if present (e.g., single-service Render deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/game') || req.path.startsWith('/auth') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    if (req.accepts('html')) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HelloDetective!</title>
          <style>
            body {
              background-color: #16100a;
              color: #ecd8c2;
              font-family: 'Courier New', Courier, monospace;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              border: 2px solid #8e6d50;
              padding: 40px;
              background: #241a12;
              box-shadow: 0 10px 30px rgba(0,0,0,0.8);
              border-radius: 8px;
              max-width: 520px;
            }
            h1 { color: #ffd54f; margin-bottom: 12px; font-size: 1.8rem; }
            p { color: #d0b89f; font-size: 1.05rem; line-height: 1.5; }
            .badge { background: #2e7d32; color: white; padding: 5px 12px; border-radius: 4px; font-size: 0.82rem; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🔍 Welcome to HelloDetective!</h1>
            <p>The AI Mystery Engine backend service is live and ready for investigations.</p>
            <span class="badge">● SERVER ACTIVE</span>
          </div>
        </body>
        </html>
      `);
    }
    return res.json({
      message: 'Welcome to HelloDetective!',
      status: 'online',
      endpoints: {
        game: '/api/game',
        auth: '/api/auth'
      }
    });
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
