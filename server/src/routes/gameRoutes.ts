import { Router } from 'express';
import {
  startNewGame,
  getSessionState,
  chatSuspect,
  canvassLocation,
  chatOfficer,
  submitDeduction,
  submitWarrant,
  saveNotes,
  recordClue,
  listStories,
  getStoryById,
  createStory,
  generateAiStory
} from '../controllers/gameController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { llmRateLimit, storyGenerationRateLimit } from '../middleware/security.js';

const router = Router();

// Gameplay endpoints
router.post('/start', optionalAuth, startNewGame);
router.get('/start', (_req, res) => {
  res.json({
    status: 'online',
    endpoint: '/api/game/start',
    allowedMethod: 'POST',
    message: 'To initiate a new detective game session, submit an HTTP POST request to this endpoint with optional { storyId } in the JSON body.'
  });
});
router.get('/session/:sessionId', optionalAuth, getSessionState);
router.post('/chat', llmRateLimit, optionalAuth, chatSuspect);
router.post('/location/canvass', optionalAuth, canvassLocation);
router.post('/officer/chat', llmRateLimit, optionalAuth, chatOfficer);
router.post('/deduction', llmRateLimit, optionalAuth, submitDeduction);
router.post('/warrant', llmRateLimit, optionalAuth, submitWarrant);
router.post('/notes', optionalAuth, saveNotes);
router.post('/clue', optionalAuth, recordClue);

// Story management endpoints
router.get('/stories', optionalAuth, listStories);
router.get('/stories/:storyId', optionalAuth, getStoryById);
router.post('/stories', requireAuth, createStory);
router.post('/stories/generate', storyGenerationRateLimit, requireAuth, generateAiStory);

export default router;
