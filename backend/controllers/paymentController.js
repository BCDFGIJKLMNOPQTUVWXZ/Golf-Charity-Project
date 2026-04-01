import { supabase } from '../supabaseClient.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance securely
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const options = {
      amount: 50000,  // ₹500 in paise
      currency: "INR",
      receipt: `rcpt_${userId.slice(0, 10)}`
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({ 
      id: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
    
  } catch (err) {
    console.error('Order Creation Error:', err);
    return res.status(500).json({ error: 'Failed to create razorpay order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment signature details' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Valid signature -> Update Profile to active
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
         console.error('Error updating subscription status:', error);
         return res.status(500).json({ error: 'Failed to update user profile' });
      }

      return res.status(200).json({ status: 'success', message: 'Payment verified and subscription activated.' });
    } else {
      return res.status(400).json({ status: 'failure', error: 'Invalid Payment Signature' });
    }
    
  } catch (err) {
    console.error('Payment Verification Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
