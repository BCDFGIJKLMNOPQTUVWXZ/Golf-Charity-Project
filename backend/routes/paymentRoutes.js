import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', authenticateJWT, createOrder);
router.post('/verify', authenticateJWT, verifyPayment);

export default router;
