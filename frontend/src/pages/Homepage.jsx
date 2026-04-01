import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, List, HeartHandshake, Trophy, ArrowRight, Home, ShieldAlert, Sparkles, Sprout, Building, Droplets } from 'lucide-react';

const Homepage = () => {
  const navigate = useNavigate();

  // Premium Unsplash Placeholders mapping closely to Charity x Golf aesthetic
  const images = {
    golf1: 'https://th.bing.com/th/id/R.0994f7dc3ddd612de92d663e46ad3a54?rik=g3QF%2bzCjCj3oMQ&riu=http%3a%2f%2fwondrlust.com%2fwp-content%2fuploads%2f2020%2f11%2fgolf-header-image.jpg&ehk=TtuRfDFu95mEaLmLze7qixK2TII0eY4XpqLj1iWe8s0%3d&risl=&pid=ImgRaw&r=0',
    golf2: 'https://tse3.mm.bing.net/th/id/OIP.AibYcdcmlqFLA05pQHvZKAHaEL?rs=1&pid=ImgDetMain&o=7&rm=3',
    golf3: 'https://cdn.pixabay.com/photo/2015/05/28/10/12/golf-787826_1280.jpg',
    charity1: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    charity2: 'https://media.istockphoto.com/id/1398755892/photo/food-donation.jpg?s=170667a&w=0&k=20&c=6YQIEzeiJc5vwhXbA1m_bQsRvefd0Z4LpHnB4p5-_3M=',
    charity3: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=800',
    collage1: 'https://cdn.pixabay.com/photo/2016/04/13/13/13/volunteer-1326758_1280.png',
    collage2: 'https://miro.medium.com/v2/resize:fit:1024/1*4P8ZllOXwcvdPqBXaNZBFg.jpeg',
    collage3: 'https://images.unsplash.com/photo-1622323758558-8d1513e61e9b?auto=format&fit=crop&q=80&w=600',
    collage4: 'https://www.actionaidindia.org/wp-content/uploads/2023/04/Humanitarian-Response-to-Joshimath-Crisis-Feature-Image.png'
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">

      {/* 1. HERO SECTION (Floating Grid) */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-20">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating Images mapped around the center */}
        <div className="absolute inset-0 max-w-7xl mx-auto w-full h-full pointer-events-none hidden md:block z-0">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[5%] w-48 h-64 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl skew-y-6"
          >
            <img src={images.golf1} className="w-full h-full object-cover" alt="Golf" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[10%] right-[10%] w-56 h-72 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl -skew-y-3"
          >
            <img src={images.charity1} className="w-full h-full object-cover" alt="Charity" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>

          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[20%] left-[12%] w-64 h-48 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl -skew-y-6"
          >
            <img src={images.golf2} className="w-full h-full object-cover" alt="Community" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>

          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-[15%] right-[5%] w-48 h-56 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl skew-y-3"
          >
            <img src={images.golf3} className="w-full h-full object-cover" alt="Golf Match" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        </div>

        {/* Center Text Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-semibold mb-8 text-zinc-300">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Defining the new standard
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500">
            Take the leap like millions before you
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Join the Club where your game funds verified impact. Win Big. Give Back.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="px-10 py-5 rounded-full bg-white text-zinc-950 font-bold text-lg hover:bg-zinc-200 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] w-full sm:w-auto"
            >
              Start Now
            </button>
            <button
              onClick={() => navigate('/charities')}
              className="px-10 py-5 rounded-full bg-zinc-900 border border-zinc-800 text-white font-bold text-lg hover:bg-zinc-800 transition-transform active:scale-95 w-full sm:w-auto"
            >
              Explore Charities
            </button>
          </div>
        </motion.div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="py-32 bg-zinc-950 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-4">How It Works</h2>
            <p className="text-zinc-500 text-lg">Four simple steps to transform your game into global change.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center transition-all hover:border-indigo-500/50"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Join the Club</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Subscribe for just ₹500/mo to unlock access to the verified tracking platform and prize pools.</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center transition-all hover:border-purple-500/50"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                <List className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Your Game</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Submit your daily scores to build your Rolling 5 Stableford handicap securely stored on-chain.</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center transition-all hover:border-emerald-500/50"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fund Proven Charities</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">10% Min. allocation of your subscription goes to the charity of your choice, or make direct donations.</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center transition-all hover:border-amber-500/50"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Win Verified Impact</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Qualify for massive Monthly Lottery Draws and exclusive rewards based on your participation.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM IMPACT & CHARITIES */}
      <section className="py-32 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <motion.h2
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-black tracking-tighter"
            >
              Platform Impact:<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                ₹10,450,230 Raised
              </span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Charity Card 1 */}
            <div className="bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-800 group hover:border-zinc-700 transition-colors">
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
                <img src={images.charity1} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="BuildOn" />
                <div className="absolute top-4 left-4 z-20 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Education
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black mb-3 text-white">BuildOn</h3>
                <p className="text-zinc-400 text-sm mb-6 h-16 line-clamp-3">Breaking the cycle of poverty, illiteracy, and low expectations through service and education in the world's poorest countries.</p>
                <div className="mb-8 border-l-2 border-emerald-500 pl-4 py-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Impact Verified</p>
                  <p className="text-2xl font-black text-emerald-400">$50</p>
                </div>
                <button onClick={() => navigate('/charities')} className="w-full py-4 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                  Donate Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Charity Card 2 */}
            <div className="bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-800 group hover:border-zinc-700 transition-colors">
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
                <img src={images.charity2} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Trees for the Future" />
                <div className="absolute top-4 left-4 z-20 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5" /> Environment
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black mb-3 text-white">Trees for the Future</h3>
                <p className="text-zinc-400 text-sm mb-6 h-16 line-clamp-3">Ending hunger and poverty by training farmers to regenerate their land using Forest Garden planting methodologies.</p>
                <div className="mb-8 border-l-2 border-emerald-500 pl-4 py-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Impact Verified</p>
                  <p className="text-2xl font-black text-emerald-400">$50</p>
                </div>
                <button onClick={() => navigate('/charities')} className="w-full py-4 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                  Donate Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Charity Card 3 */}
            <div className="bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-800 group hover:border-zinc-700 transition-colors">
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
                <img src={images.charity3} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Ocean CleanUp" />
                <div className="absolute top-4 left-4 z-20 bg-cyan-500/20 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" /> Environmental
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black mb-3 text-white">Ocean CleanUp</h3>
                <p className="text-zinc-400 text-sm mb-6 h-16 line-clamp-3">Developing advanced technologies to rid the world's oceans of plastic, extracting accumulated garbage organically.</p>
                <div className="mb-8 border-l-2 border-emerald-500 pl-4 py-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Impact Verified</p>
                  <p className="text-2xl font-black text-emerald-400">$50</p>
                </div>
                <button onClick={() => navigate('/charities')} className="w-full py-4 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                  Donate Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUBSCRIBE & WIN (The Collage) */}
      <section className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Side Content */}
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              What if the whole world...
            </h2>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-medium">
              ...teamed up on Sunday morning to play for something bigger than themselves? Together we are building the world's largest verifiable community impact fund driven by the love of the game.
            </p>
            <button
              onClick={() => navigate('/login')} // Will be wired to Razorpay later
              className="px-8 py-5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-lg hover:from-indigo-400 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Subscribe to the Draw <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-zinc-600 mt-4 font-semibold uppercase tracking-wider">₹500/Month • Cancel Anytime • Verified Impact</p>
          </div>

          {/* Right Side Pinterest-Style Masonry Collage */}
          <div className="relative h-[600px] w-full hidden md:block">
            {/* Top Left */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute top-0 left-0 w-[45%] h-[40%] rounded-3xl overflow-hidden shadow-2xl z-10 hover:z-50 transition-all"
            >
              <img src={images.collage1} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Collage 1" />
            </motion.div>

            {/* Top Right (Tall) */}
            <motion.div
              initial={{ opacity: 0, x: -20, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="absolute top-[5%] right-0 w-[50%] h-[55%] rounded-3xl overflow-hidden shadow-2xl z-20 hover:z-50 transition-all border border-zinc-800"
            >
              <img src={images.collage2} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Collage 2" />
            </motion.div>

            {/* Bottom Left (Wide) */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="absolute bottom-[2%] left-[5%] w-[55%] h-[45%] rounded-[2.5rem] overflow-hidden shadow-2xl z-30 hover:z-50 transition-all border border-zinc-800"
            >
              <img src={images.collage3} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Collage 3" />
            </motion.div>

            {/* Bottom Right (Small) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              className="absolute bottom-[-5%] right-[10%] w-[35%] h-[35%] rounded-[2rem] overflow-hidden shadow-2xl z-40 hover:z-50 transition-all border border-zinc-800"
            >
              <img src={images.collage4} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Collage 4" />
            </motion.div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Homepage;
