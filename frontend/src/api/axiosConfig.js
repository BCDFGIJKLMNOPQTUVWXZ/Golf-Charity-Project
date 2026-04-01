import axios from 'axios';
import { supabase } from '../supabaseClient.js';

// Base instance configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Supabase JWT token
api.interceptors.request.use(
  async (config) => {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!error && session?.access_token) {
      // Attach the token as a Bearer token
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for handling 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is due to an invalid/expired token
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access, you might need to log in again.');
      // Add any global redirect logic or state update here if needed
    }
    return Promise.reject(error);
  }
);

export default api;
