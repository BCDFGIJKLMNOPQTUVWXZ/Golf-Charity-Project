import express from 'express';
import { selectCharity, getProfile, getWinnerStatus } from '../controllers/profileController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.post('/select-charity', authenticateJWT, selectCharity);
// Replaces old /:userId parameter fetching
router.get('/', authenticateJWT, getProfile);

router.get('/winner-status', authenticateJWT, getWinnerStatus);
export default router;
