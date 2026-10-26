import { Router } from 'express';
import { startNewGame, chatSuspect, submitDeduction, submitWarrant } from '../controllers/GameController';

const router = Router();

router.post('/start', startNewGame);
router.post('/chat', chatSuspect);
router.post('/deduction', submitDeduction);
router.post('/warrant', submitWarrant);

export default router;