import express from 'express';
import { addScore, getUserScores } from '../controllers/scoreController.js';
import { authenticateJWT, ensureSubscribed } from '../middleware/auth.js';

const router = express.Router();

router.post('/add', authenticateJWT, ensureSubscribed, addScore);
// We no longer need verify user route via :userId, so we just use the authenticated root route
router.get('/', authenticateJWT, getUserScores);

export default router;
