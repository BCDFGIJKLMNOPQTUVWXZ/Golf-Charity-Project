import express from 'express';
import { getCharities, makeOneOffDonation } from '../controllers/charityController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Public route for fetching charities
router.get('/charities', getCharities);

// Protected route for one-off donations
router.post('/donations/one-off', authenticateJWT, makeOneOffDonation);

export default router;
