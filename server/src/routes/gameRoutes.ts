import { Router } from 'express';
import { startGame, getGameStatus, submitWarrant } from '../controllers/gameController.js';
import { submitDeduction } from '../controllers/officerController.js';

const router = Router();

// Core Game Flow
router.post('/start', startGame);
router.get('/:sessionId/status', getGameStatus);
router.post('/:sessionId/warrant', submitWarrant);

// Officer & Deduction Gate
router.post('/deduction', submitDeduction);

export default router;