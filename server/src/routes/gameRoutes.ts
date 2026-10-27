import { Router } from 'express';
import {
  startNewGame,
  getSessionState,
  chatSuspect,
  submitDeduction,
  submitWarrant,
  saveNotes,
  recordClue,
  listStories,
  getStoryById,
  createStory,
  generateAiStory
} from '../controllers/gameController';

const router = Router();

// Gameplay endpoints
router.post('/start', startNewGame);
router.get('/session/:sessionId', getSessionState);
router.post('/chat', chatSuspect);
router.post('/deduction', submitDeduction);
router.post('/warrant', submitWarrant);
router.post('/notes', saveNotes);
router.post('/clue', recordClue);

// Story management endpoints
router.get('/stories', listStories);
router.get('/stories/:storyId', getStoryById);
router.post('/stories', createStory);
router.post('/stories/generate', generateAiStory);

export default router;