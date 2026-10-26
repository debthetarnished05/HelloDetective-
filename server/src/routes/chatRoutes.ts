import { Router } from 'express';
import { interrogateSuspect } from '../controllers/chatController.js';

const router = Router();

// Route: POST /api/chat/:sessionId/interrogate
router.post('/:sessionId/interrogate', interrogateSuspect);

export default router;