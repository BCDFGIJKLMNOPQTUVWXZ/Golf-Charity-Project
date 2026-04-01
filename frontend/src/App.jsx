import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { AnimatePresence } from 'framer-motion';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import CharityExplorer from './pages/CharityExplorer';
import Homepage from './pages/Homepage';
import AdminDashboard from './pages/AdminDashboard';

const AnimatedRoutes = ({ session }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* LANDING: Only redirect to dashboard if they are actually logged in */}
        <Route
          path="/"
          element={<Homepage />}
        />

        {/* AUTH: Only show login/signup if NOT logged in */}
        <Route
          path="/login"
          element={!session ? <LoginPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/signup"
          element={!session ? <SignupPage /> : <Navigate to="/dashboard" />}
        />

        {/* PUBLIC ACCESS: This is the fix! Remove the session check here */}
        <Route
          path="/charities"
          element={<CharityExplorer />}
        />

        {/* PROTECTED: Keep the dashboard locked */}
        <Route
          path="/dashboard"
          element={session ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={session ? <AdminDashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes session={session} />
    </Router>
  );
}

export default App;
