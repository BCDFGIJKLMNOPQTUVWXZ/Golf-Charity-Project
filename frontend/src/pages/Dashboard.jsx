import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Home, User, Activity, Plus, AlertCircle, TrendingUp, Lock, Trophy, UploadCloud, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/axiosConfig';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);
  const [scoreInput, setScoreInput] = useState('');
  const [loadingScores, setLoadingScores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [favoriteCharityName, setFavoriteCharityName] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Impact Profile Setup
  const [donationPercent, setDonationPercent] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Dynamically load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchScores();
      fetchProfile();
      fetchWinnerStatus();
    }
  }, [user]);

  const fetchWinnerStatus = async () => {
    try {
      const res = await api.get('/api/profiles/winner-status');
      if (res.data.isWinner) {
        setWinnerData(res.data);
        if (res.data.status === 'pending') {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.3 } });
        }
      }
    } catch (err) {
      console.error("Failed to fetch winner status", err);
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('score-proofs')
        .upload(fileName, file);
        
      if (error) throw error;
      
      const publicUrl = supabase.storage.from('score-proofs').getPublicUrl(fileName).data.publicUrl;
      
      // Update winners table
      const { error: dbErr } = await supabase.from('winners')
        .update({ proof_url: publicUrl, status: 'verified' })
        .eq('id', winnerData.winnerId);
        
      if(dbErr) throw dbErr;
      
      fetchWinnerStatus();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading proof. Ensure the 'score-proofs' bucket is public and you have write access.");
    } finally {
      setUploadingProof(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profiles');
      if (res.data.profile) {
        setProfile(res.data.profile);
        setDonationPercent(res.data.profile.donation_percent || 10);

        if (res.data.profile.favorite_charity_id) {
          try {
            const charitiesRes = await api.get('/api/charities');
            const matchedCharity = charitiesRes.data.data?.find(c => c.id === res.data.profile.favorite_charity_id);
            if (matchedCharity) setFavoriteCharityName(matchedCharity.name);
          } catch (err) {
            console.error("Failed to fetch matching charity name", err);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile settings", err);
    }
  };

  const saveImpactSettings = async () => {
    if (!user || !profile?.favorite_charity_id) return;
    setSavingSettings(true);
    try {
      await api.post('/api/profiles/select-charity', {
        charityId: profile.favorite_charity_id,
        donationPercent: donationPercent
      });
    } catch (err) {
      console.error("Failed to update settings", err);
    } finally {
      setTimeout(() => setSavingSettings(false), 500);
    }
  };

  const handleSubscribe = async () => {
    setLoadingPayment(true);
    try {
      // 1. Create order on backend
      const { data: order } = await api.post('/api/payments/create-order');

      // 2. Initialize Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_id',
        amount: order.amount,
        currency: order.currency,
        name: 'Premium Golf Club',
        description: 'Monthly Subscription to Verified Impact Draws',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment Signature on Backend
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // 4. Force Profile Refresh to unlock UI instantly
            await fetchProfile();
          } catch (verifyErr) {
            console.error("Verification failed:", verifyErr);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: '#6366f1' // indigo-500
        }
      };

      const rzp1 = new window.Razorpay(options);

      rzp1.on('payment.failed', function (response) {
        console.error("Payment modal failed:", response.error);
      });

      rzp1.open();

    } catch (err) {
      console.error("Failed to initiate subscription:", err);
      alert("Failed to initialize payment gateway. Check console.");
    } finally {
      setLoadingPayment(false);
    }
  };

  const fetchScores = async () => {
    setLoadingScores(true);
    try {
      const res = await api.get('/api/scores');
      setScores(res.data.scores || []);
    } catch (err) {
      console.error("Failed to fetch scores", err);
    } finally {
      setLoadingScores(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Tell Supabase to sign out
      await supabase.auth.signOut();

      // 2. Clear any local storage just in case
      localStorage.clear();

      // 3. Instead of navigate('/'), use a hard window reload to the root.
      // This is the "Nuclear Option" that fixes 99% of redirect bugs.
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = '/';
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const val = parseInt(scoreInput, 10);

    if (!val || val < 1 || val > 45) {
      setErrorMsg('Please enter a valid number between 1 and 45.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/scores/add', {
        scoreValue: val
      });
      // updating with latest scores
      setScores(res.data.scores || []);
      setScoreInput('');
    } catch (err) {
      console.error("Failed to submit score", err);
      setErrorMsg(err.response?.data?.error || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 selection:bg-indigo-500/30">
      <nav className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div onClick={() => navigate('/')} className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Home className="w-5 h-5 text-white" />
          </div>
          Dashboard
        </div>
        <div className="flex items-center gap-4">
          {profile?.role === 'admin' && (
            <a
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              Admin
            </a>
          )}
          <a
            href="/charities"
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Explore Charities &rarr;
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {winnerData && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0 border border-white/50 shadow-inner">
                  <Trophy className="w-8 h-8 text-amber-100" />
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-1">You Won!</h2>
                  <p className="text-amber-100 font-medium text-lg">You matched {winnerData.matchCount} numbers in the latest draw.</p>
                </div>
              </div>

              <div className="bg-black/20 p-5 rounded-2xl border border-white/20 text-center min-w-[200px]">
                <p className="text-amber-200 text-sm font-bold uppercase tracking-widest mb-1">Prize Awarded</p>
                <p className="text-4xl font-black text-white">₹{winnerData.prizeAmount?.toLocaleString()}</p>
              </div>

              <div className="flex-1 max-w-sm w-full bg-white text-zinc-900 p-5 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center">
                {winnerData.status === 'pending' && (
                  <>
                    <p className="text-sm font-bold mb-3 text-zinc-500">Upload Screen Proof of Score</p>
                    <label className={`w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 ${uploadingProof ? 'opacity-50 pointer-events-none' : ''}`}>
                      <UploadCloud className="w-5 h-5" />
                      {uploadingProof ? 'Uploading...' : 'Select File'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
                    </label>
                  </>
                )}
                {winnerData.status === 'verified' && (
                  <div className="flex flex-col items-center justify-center text-amber-500">
                    <Activity className="w-8 h-8 mb-2 animate-pulse" />
                    <p className="font-black text-lg">Payment Processing</p>
                    <p className="text-xs text-zinc-500 font-medium">Your proof is verified. Funds are on the way.</p>
                  </div>
                )}
                {winnerData.status === 'paid' && (
                  <div className="flex flex-col items-center justify-center text-emerald-500">
                    <Trophy className="w-8 h-8 mb-2" />
                    <p className="font-black text-lg">Payment Complete!</p>
                    <p className="text-xs text-emerald-600 font-medium">Check your account balance.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Form & Profile */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-2">
                Overview
              </h1>
              <div className="flex items-center gap-3 mt-6 mb-8 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-zinc-500 font-medium mb-0.5">Logged in as</p>
                  <p className="text-sm text-zinc-200 font-medium truncate">{user?.email || 'Loading...'}</p>
                </div>
              </div>

              {/* Add Score Form */}
              <div className="pt-6 border-t border-zinc-800/80 mb-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Submit New Score
                </h3>

                <form onSubmit={handleSubmitScore} className="space-y-4">
                  {profile?.subscription_status !== 'active' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-4 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-red-400 font-bold mb-1">Please subscribe to enter the Draw</h4>
                          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                            You must be an active subscriber to participate in the rolling Stableford pools and fund verified charities.
                          </p>
                          <button
                            type="button"
                            onClick={handleSubscribe}
                            disabled={loadingPayment}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2"
                          >
                            {loadingPayment ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              'Subscribe Now - ₹500/mo'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label htmlFor="score" className="block text-sm font-medium text-zinc-400 mb-2">
                      Score Value (1-45)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="score"
                        min="1"
                        max="45"
                        disabled={submitting || profile?.subscription_status !== 'active'}
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        placeholder="e.g. 24"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !scoreInput || profile?.subscription_status !== 'active'}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Submit Entry
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Impact Settings Panel */}
              <div className="pt-6 border-t border-zinc-800/80">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Impact Settings
                </h3>

                <div className="mt-4">
                  <div className="mb-4 text-sm font-medium">
                    <span className="text-zinc-500">Favorite Charity:</span>
                    {profile?.favorite_charity_id ? (
                      <p className="text-zinc-200 bg-zinc-950/50 border border-zinc-800 mt-2 px-3 py-2 rounded-xl text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{favoriteCharityName || 'Loading name...'}</p>
                    ) : (
                      <p className="text-amber-400/90 bg-amber-400/10 border border-amber-400/20 mt-2 px-3 py-2 rounded-xl text-xs">No favorite selected. Setup your favorite in Charity Explorer.</p>
                    )}
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-500">Donation Allocation (%)</label>
                    <span className="text-lg font-bold text-indigo-400">{donationPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={donationPercent}
                    onChange={(e) => setDonationPercent(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 font-bold mt-2">
                    <span>10% MIN</span>
                    <span>100% MAX</span>
                  </div>

                  <button
                    onClick={saveImpactSettings}
                    disabled={savingSettings || !profile?.favorite_charity_id}
                    className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSettings ? 'Saving...' : 'Update Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Scores */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-zinc-200 px-2 flex items-center justify-between">
              <span>Rolling 5 Insights</span>
              <span className="text-xs font-semibold bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full">
                {scores.length} / 5
              </span>
            </h2>

            {loadingScores ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : scores.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-3xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center shadow-inner">
                <Activity className="w-12 h-12 mb-4 opacity-50 text-zinc-600" />
                <p className="text-lg font-medium text-zinc-400">No scores recorded yet.</p>
                <p className="text-sm mt-1 max-w-sm">Submit your first score using the form on the left to start building your rolling insights.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {scores.map((score, index) => (
                    <motion.div
                      key={score.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{
                        duration: 0.5,
                        type: 'spring',
                        bounce: 0.3,
                        layout: { duration: 0.4 }
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors"
                    >
                      {/* Gradient glow effect for the newest item */}
                      {index === 0 && (
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                      )}

                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-2">
                            Recorded Value
                            {index === 0 && <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">Newest</span>}
                          </p>
                          <p className="text-5xl font-black text-white tracking-tighter">{score.score_value}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${index === 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:text-zinc-400'}`}>
                          <Activity className="w-7 h-7" />
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex justify-between items-center text-xs font-medium text-zinc-500">
                        <span className="font-mono text-zinc-600 bg-zinc-950 px-2 py-1 rounded-md">ID: {score.id.slice(0, 6)}</span>
                        <span>
                          {new Date(score.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(score.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
