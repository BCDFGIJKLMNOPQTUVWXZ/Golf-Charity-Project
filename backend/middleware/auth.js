import { supabase } from '../supabaseClient.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user to the request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Middleware to check if user is subscribed (Premium role)
export const ensureSubscribed = async (req, res, next) => {
  try {
    // strict requirement: extract userId from req.user.id
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not found in request' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase Error in ensureSubscribed:', error);
      return res.status(500).json({ error: error.message });
    }

    // Role logic: active = Premium, anything else (or no profile) = Guest
    if (!profile || profile.subscription_status !== 'active') {
      return res.status(403).json({ error: 'Please subscribe to enter the Draw' });
    }

    next();
  } catch (err) {
    console.error('ensureSubscribed Middleware Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const ensureAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized: User not found in request' });

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (err) {
    console.error('ensureAdmin Middleware Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
