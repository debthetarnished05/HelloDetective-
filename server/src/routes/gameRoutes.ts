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
} from '../controllers/gameController';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Gameplay endpoints
router.post('/start', optionalAuth, startNewGame);
router.get('/session/:sessionId', optionalAuth, getSessionState);
router.post('/chat', optionalAuth, chatSuspect);
router.post('/location/canvass', optionalAuth, canvassLocation);
router.post('/officer/chat', optionalAuth, chatOfficer);
router.post('/deduction', optionalAuth, submitDeduction);
router.post('/warrant', optionalAuth, submitWarrant);
router.post('/notes', optionalAuth, saveNotes);
router.post('/clue', optionalAuth, recordClue);

// Story management endpoints
router.get('/stories', optionalAuth, listStories);
router.get('/stories/:storyId', optionalAuth, getStoryById);
router.post('/stories', requireAuth, createStory);
router.post('/stories/generate', requireAuth, generateAiStory);

export default router;