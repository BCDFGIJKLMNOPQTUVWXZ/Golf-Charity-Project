import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import api from '../api/axiosConfig';
import { ShieldAlert, Users, DollarSign, PlayCircle, Activity, CheckCircle, Trash2, Zap, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [charityName, setCharityName] = useState('');
  const [charityDesc, setCharityDesc] = useState('');
  const [charities, setCharities] = useState([]);
  const [drawMode, setDrawMode] = useState('frequent');

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const [statsRes, queueRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/verification-queue')
      ]);
      setStats(statsRes.data);
      setCharities(Array.isArray(statsRes.data.charities) ? statsRes.data.charities : []);
      setVerificationQueue(Array.isArray(queueRes.data.queue) ? queueRes.data.queue : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await api.post('/api/admin/simulate-draw', { mode: drawMode });
      setSimulation(res.data);
    } catch (err) {
      alert("Failed to run simulation! Check console.");
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const publishDraw = async () => {
    if (!simulation) return;
    if (!window.confirm("WARNING: This will commit the draw to the database and alert the winners. Proceed?")) return;
    
    setCommitting(true);
    try {
      await api.post('/api/admin/commit-draw', { mode: drawMode });
      alert("Success! Draw is finalized.");
      setSimulation(null);
      fetchInitData(); 
    } catch (err) {
      alert("Error committing draw");
    } finally {
      setCommitting(false);
    }
  };

  const updatePaymentStatus = async (winnerId) => {
    if(!window.confirm("Mark as paid?")) return;
    try {
      await api.post('/api/admin/approve-payment', { winnerId });
      fetchInitData();
    } catch (err) {
      alert("Error approving payment");
    }
  };

  const handleAddCharity = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/charity', { name: charityName, description: charityDesc, category: 'General' });
      setCharityName('');
      setCharityDesc('');
      fetchInitData();
    } catch (err) {
      alert('Error adding charity');
    }
  };

  const deleteCharity = async (id) => {
    try {
      await api.delete(`/api/admin/charity/${id}`);
      fetchInitData();
    } catch (err) {
      alert('Error deleting charity');
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading Admin Engine...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Engine Command Center</h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><Users className="text-indigo-400 w-5 h-5"/> <h3 className="text-zinc-400 font-medium">Total Users</h3></div>
            <p className="text-4xl font-black">{stats?.totalUsers}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><Activity className="text-emerald-400 w-5 h-5"/> <h3 className="text-zinc-400 font-medium">Active Subs</h3></div>
            <p className="text-4xl font-black">{stats?.activeSubs}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-2 relative z-10"><DollarSign className="text-amber-400 w-5 h-5"/> <h3 className="text-zinc-400 font-medium">Estimated Pool (incl. Rollover)</h3></div>
            <p className="text-4xl font-black text-amber-500 relative z-10">₹{((stats?.pool || 0) + (stats?.currentRollover || 0)).toLocaleString()}</p>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 z-0"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
           {/* Algorithm Draw Execution */}
           <div className="bg-zinc-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
             
             <h2 className="text-2xl font-bold mb-6 text-white relative z-10">Conduct Monthly Draw</h2>
             
             {!simulation ? (
               <div className="relative z-10">
                 {/* Algorithm Toggle */}
                 <div className="bg-zinc-950 rounded-xl p-1 flex mb-4 border border-zinc-800">
                   <button
                     onClick={() => setDrawMode('random')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                       drawMode === 'random'
                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                         : 'text-zinc-500 hover:text-zinc-300'
                     }`}
                   >
                     <Zap className="w-4 h-4" /> Random RNG
                   </button>
                   <button
                     onClick={() => setDrawMode('frequent')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                       drawMode === 'frequent'
                         ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                         : 'text-zinc-500 hover:text-zinc-300'
                     }`}
                   >
                     <BarChart3 className="w-4 h-4" /> Frequent Score
                   </button>
                 </div>

                 {drawMode === 'frequent' && (
                   <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-400 font-medium">
                     <BarChart3 className="w-4 h-4 inline mr-2 -mt-0.5" />
                     Winning numbers based on top 5 most submitted scores by active users.
                   </div>
                 )}

                 <p className="text-zinc-400 mb-6">
                   {drawMode === 'random'
                     ? 'Generates 5 pure random numbers (1–45) and intersects against all active user scores. Does NOT write to the database.'
                     : 'Analyses score frequency from the last 30 days and selects the top 5 most submitted values as the winning set. Does NOT write to the database.'}
                 </p>
                 <button onClick={runSimulation} disabled={simulating} className={`flex items-center gap-2 w-full justify-center py-4 rounded-xl font-bold transition-all shadow-lg ${drawMode === 'frequent' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}>
                    <PlayCircle className="w-5 h-5" /> {simulating ? "Analysing Scores..." : "Pre-Analysis Simulation"}
                 </button>
               </div>
             ) : (
               <div className="relative z-10 space-y-6">
                 <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                   <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Winning Numbers Generated</h3>
                   <div className="flex gap-2">
                     {Array.isArray(simulation.winningNumbers) && simulation.winningNumbers.map((n, i) => (
                       <div key={i} className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                         {n}
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div className="bg-zinc-950 p-4 rounded-xl text-center border border-zinc-800">
                     <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Tier 1 (40%)</div>
                     <div className="text-lg font-bold text-amber-500">₹{(simulation.poolSize * 0.40).toLocaleString()}</div>
                   </div>
                   <div className="bg-zinc-950 p-4 rounded-xl text-center border border-zinc-800">
                     <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Tier 2 (35%)</div>
                     <div className="text-lg font-bold text-slate-300">₹{(simulation.poolSize * 0.35).toLocaleString()}</div>
                   </div>
                   <div className="bg-zinc-950 p-4 rounded-xl text-center border border-zinc-800">
                     <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Tier 3 (25%)</div>
                     <div className="text-lg font-bold text-amber-700">₹{(simulation.poolSize * 0.25).toLocaleString()}</div>
                   </div>
                 </div>

                 <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 max-h-48 overflow-y-auto">
                    <h3 className="text-zinc-500 text-sm font-semibold mb-3">Intersected Winners ({Array.isArray(simulation.winners) ? simulation.winners.length : 0})</h3>
                    {Array.isArray(simulation.winners) && simulation.winners.map((w, i) => (
                      <div key={i} className="flex justify-between items-center bg-zinc-900 p-2 rounded mb-2 border border-zinc-800">
                        <span className="text-sm font-medium">{w.email}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">{w.match_count} Match</span>
                          <span className="text-sm font-bold text-emerald-400">₹{(w.prize || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {(!Array.isArray(simulation.winners) || simulation.winners.length === 0) && <p className="text-zinc-500 text-sm italic">No winners this round.</p>}
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => setSimulation(null)} disabled={committing} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors">Discard</button>
                    <button onClick={publishDraw} disabled={committing} className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-red-600/20 transition-all">
                      <ShieldAlert className="w-5 h-5"/> {committing ? "Writing DB..." : "Confirm & Commit Draw"}
                    </button>
                 </div>
               </div>
             )}
           </div>

           {/* Verification Queue */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
             <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">Verification Queue <span className="bg-zinc-800 text-xs px-2 py-1 rounded-full text-zinc-400">{verificationQueue.length} Pending</span></h2>
             
             <div className="flex-1 overflow-y-auto">
                {verificationQueue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                    <p>No pending verifications.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verificationQueue.map((vq) => (
                      <div key={vq.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-sm text-indigo-400 mb-1">{vq.profiles?.email}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">Amount:</span>
                              <span className="text-sm font-black text-emerald-400">₹{vq.prize_amount.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500 mb-1">Status</p>
                            <span className={`text-xs px-2 py-1 rounded font-bold ${vq.status === 'verified' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                              {vq.status.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {vq.proof_url ? (
                           <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                             <a href={vq.proof_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:underline">View Uploaded Image Proof</a>
                             <button onClick={() => updatePaymentStatus(vq.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-bold transition-all">Mark as Paid</button>
                           </div>
                        ) : (
                           <p className="border-t border-zinc-800 pt-3 text-xs text-zinc-600 italic">Waiting for user to upload proof screenshot...</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* Charity Builder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
           <h2 className="text-2xl font-bold mb-6 text-white">Platform Charities</h2>
           <div className="flex gap-8 items-start">
             <form onSubmit={handleAddCharity} className="flex-1 space-y-4 max-w-sm">
               <div>
                  <label className="block text-sm text-zinc-400 mb-2">Charity Name</label>
                  <input required value={charityName} onChange={e=>setCharityName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
               </div>
               <div>
                  <label className="block text-sm text-zinc-400 mb-2">Description</label>
                  <input required value={charityDesc} onChange={e=>setCharityDesc(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
               </div>
               <button type="submit" className="bg-white text-black font-bold py-2 px-4 rounded hover:bg-zinc-200 transition-colors">Add Cause</button>
             </form>
             
             <div className="flex-[2] grid grid-cols-2 gap-4">
                {Array.isArray(charities) && charities.map(c => (
                  <div key={c.id} className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm mb-1">{c.name}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-2">{c.description}</p>
                    </div>
                    <button onClick={() => deleteCharity(c.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
