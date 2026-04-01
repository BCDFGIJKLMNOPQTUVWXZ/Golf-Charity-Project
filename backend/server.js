import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

// Modular Routes
import scoreRoutes from './routes/scoreRoutes.js';
import charityRoutes from './routes/charityRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('charities').select('*');

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Supabase Connected');
    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Register Modular Routes
app.use('/api/scores', scoreRoutes);
app.use('/api', charityRoutes); // mounts /charities and /donations/one-off
app.use('/api/profiles', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});