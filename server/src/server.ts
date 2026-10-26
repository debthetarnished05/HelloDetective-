import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // MUST have .js extension in ESM

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
await connectDB(); // In ESM, you can use top-level await if needed, or call it normally

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', stage: 'Initialization complete (ESM)' });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});