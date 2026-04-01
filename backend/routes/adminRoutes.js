import express from 'express';
import { authenticateJWT, ensureAdmin } from '../middleware/auth.js';
import { 
  getAdminStats, 
  simulateDraw, 
  commitDraw, 
  getVerificationQueue, 
  approvePayment, 
  addCharity, 
  deleteCharity 
} from '../controllers/adminController.js';

const router = express.Router();

// Enforce both JWT validity and Admin Role across all routes herein
router.use(authenticateJWT, ensureAdmin);

router.get('/stats', getAdminStats);
router.post('/simulate-draw', simulateDraw);
router.post('/commit-draw', commitDraw);
router.get('/verification-queue', getVerificationQueue);
router.post('/approve-payment', approvePayment);
router.post('/charity', addCharity);
router.delete('/charity/:id', deleteCharity);

export default router;
