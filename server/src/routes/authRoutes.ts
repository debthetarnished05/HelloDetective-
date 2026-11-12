import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimit, refreshRateLimit } from '../middleware/security.js';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/refresh', refreshRateLimit, refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
