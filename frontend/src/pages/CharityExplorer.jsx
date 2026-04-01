import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Globe, Book, Crosshair, ArrowRight, ShieldAlert, Sparkles, X, HeartHandshake } from 'lucide-react';
import api from '../api/axiosConfig';
import confetti from 'canvas-confetti';

const CharityExplorer = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [selectedCharity, setSelectedCharity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  const [favoritesState, setFavoritesState] = useState(null); // tracking user's favorite charity id
  const [profileLoading, setProfileLoading] = useState(false);
  const debounceTimer = useRef(null);

  const categories = ['Environment', 'Education', 'Health', 'Crisis Relief', 'Animals'];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserProfile();
      }
    });

    // Initial fetch
    fetchCharities('', '');
  }, []);

  const fetchUserProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/api/profiles');
      if (res.data.profile) {
        setFavoritesState(res.data.profile.favorite_charity_id);
      }
    } catch (err) {
      console.error("Failed to fetch profile settings", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchCharities = async (search, cat) => {
    setLoading(true);
    try {
      let url = '/api/charities?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (cat) url += `category=${encodeURIComponent(cat)}`;
      const res = await api.get(url);
      setCharities(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch charities:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchCharities(searchTerm, categoryFilter);
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, categoryFilter]);

  const fireConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (!session || !selectedCharity || !donationAmount || donating) return;

    setDonating(true);
    try {
      await api.post('/api/donations/one-off', {
        charityId: selectedCharity.id,
        amount: Number(donationAmount)
      });

      setDonationSuccess(true);
      fireConfetti();

      // We could optionally re-fetch the specific charity to show its updated total, but we'll refresh list
      fetchCharities(searchTerm, categoryFilter);

      setTimeout(() => {
        setIsModalOpen(false);
        setDonationSuccess(false);
        setDonationAmount('');
        setSelectedCharity(null);
      }, 3500);

    } catch (err) {
      console.error("Donation failed:", err);
      alert("Donation failed to process.");
    } finally {
      setDonating(false);
    }
  };

  const handleSetFavorite = async (charity) => {
    if (!session) return;

    const previousState = favoritesState;
    const isUnfavoriting = favoritesState === charity.id;
    const newFavoriteId = isUnfavoriting ? null : charity.id;

    // Quick optimistic update
    setFavoritesState(newFavoriteId);

    try {
      await api.post('/api/profiles/select-charity', {
        charityId: newFavoriteId,
        donationPercent: 10
      });
    } catch (err) {
      console.error("Failed setting favorite:", err);
      setFavoritesState(previousState);
    }
  };

  const openDonationModal = (charity) => {
    setSelectedCharity(charity);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDonationSuccess(false);
    setDonationAmount('');
    setSelectedCharity(null);
  };

  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'environment': return <Globe className="w-5 h-5" />;
      case 'education': return <Book className="w-5 h-5" />;
      case 'health': return <Crosshair className="w-5 h-5" />;
      case 'crisis relief': return <ShieldAlert className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 pb-20">

      {/* Header Bar Segment */}
      {/* Header Bar Segment */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Charity Explorer</h1>
          </div>

          {/* CONDITIONAL NAVIGATION */}
          {session ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              Back to Dashboard &rarr;
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              &larr; Back to Home
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search charities by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${categoryFilter === '' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'}`}
            >
              All Causes
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${categoryFilter === cat ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-inner' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : charities.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 border-dashed">
            <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-300">No charities found</h3>
            <p className="text-zinc-500 mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {charities.map((charity) => (
                <motion.div
                  key={charity.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative group overflow-hidden hover:border-zinc-700 transition-colors flex flex-col h-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-full">
                      {getCategoryIcon(charity.category)}
                      <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">{charity.category}</span>
                    </div>
                    {/* Favorite Button */}
                    <button
                      onClick={() => handleSetFavorite(charity)}
                      className={`p-2 rounded-full transition-all border ${favoritesState === charity.id ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-zinc-700'}`}
                      title="Set as Favorite"
                    >
                      <Heart className={`w-5 h-5 ${favoritesState === charity.id ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">{charity.name}</h3>
                  <p className="text-sm text-zinc-400 mb-6 flex-grow">{charity.description}</p>

                  <div className="pt-5 border-t border-zinc-800/80 mb-6 flex flex-col">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Total Impact Verified</span>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                      ${Number(charity.total_impact_raised || 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => openDonationModal(charity)}
                    className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-white/5"
                  >
                    Donate Now <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCharity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              {donationSuccess ? (
                <div className="text-center py-10 relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <HeartHandshake className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h2 className="text-3xl font-black text-white mb-2">Thank You!</h2>
                  <p className="text-zinc-400">Your brilliant impact of <strong className="text-emerald-400">${donationAmount}</strong> has been verified for <strong>{selectedCharity.name}</strong>.</p>
                </div>
              ) : (
                <>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                  <button onClick={closeModal} className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors bg-zinc-950 p-1.5 rounded-full border border-zinc-800">
                    <X className="w-4 h-4" />
                  </button>

                  <h2 className="text-2xl font-black text-white pr-8 mb-1 leading-tight tracking-tight">Support {selectedCharity.name}</h2>
                  <p className="text-sm text-zinc-400 mb-8">One-off direct impact transfer.</p>

                  <form onSubmit={handleDonateSubmit}>
                    <div className="mb-8">
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Amount to Donate</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">$</span>
                        <input
                          type="number"
                          min="1"
                          required
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          disabled={donating}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={donating}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={donating || !donationAmount}
                        className="flex-[2] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                      >
                        {donating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Confirm Impact'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CharityExplorer;
