import { supabase } from '../supabaseClient.js';

// 1. GET ALL ADMIN STATS & CHARITIES
export const getAdminStats = async (req, res) => {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: activeSubs } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');

    let { data: rollover } = await supabase
      .from('jackpot_rollover')
      .select('amount')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    let currentRollover = rollover ? rollover.amount : 0;
    let pool = activeSubs ? (activeSubs * 500) : 0;

    const { data: charitiesData, error: charityError } = await supabase.from('charities').select('*');
    const safeCharities = (charityError || !charitiesData) ? [] : charitiesData;

    return res.status(200).json({
      totalUsers: totalUsers || 0,
      activeSubs: activeSubs || 0,
      pool,
      currentRollover,
      charities: safeCharities
    });
  } catch (err) {
    console.error('Stats Error:', err.message);
    return res.status(500).json({ error: err.message, charities: [] });
  }
};

// 2. FREQUENCY ALGORITHM (The "Winner-First" Logic)
const _generateFrequentNumbers = async () => {
  const { data: activeUsers } = await supabase.from('profiles').select('id').eq('subscription_status', 'active');
  const activeIds = (activeUsers || []).map(u => u.id);
  if (activeIds.length === 0) return [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentScores } = await supabase.from('scores').select('score_value').in('user_id', activeIds).gte('created_at', thirtyDaysAgo);

  if (!recentScores || recentScores.length === 0) return [];

  const freqMap = {};
  recentScores.forEach(s => { freqMap[s.score_value] = (freqMap[s.score_value] || 0) + 1; });

  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .map(([val]) => Number(val))
    .slice(0, 3); // Only take top 3 — leaves 2 slots for "Random Spice"
};

// 3. DRAW ALGORITHM (Refactored for higher win rates and correct math)
const _runDrawAlgorithm = async (mode = 'random') => {
  const { count: activeSubs } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');
  const poolSize = activeSubs ? activeSubs * 500 : 0;

  const { data: ro } = await supabase.from('jackpot_rollover').select('amount').order('last_updated', { ascending: false }).limit(1).single();
  const rolloverAmount = ro ? ro.amount : 0;

  let winningNumbers = mode === 'frequent' ? await _generateFrequentNumbers() : [];
  const usedSet = new Set(winningNumbers);
  while (winningNumbers.length < 5) {
    let rand = Math.floor(Math.random() * 45) + 1;
    if (!usedSet.has(rand)) { winningNumbers.push(rand); usedSet.add(rand); }
  }

  const { data: users } = await supabase.from('profiles').select('id, email').eq('subscription_status', 'active');
  let rawWinners = [];

  for (const user of (users || [])) {
    // FIX: Look at last 20 scores so recent games aren't missed
    const { data: scores } = await supabase.from('scores').select('score_value').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);

    // FIX: Require at least 1 score to be eligible
    if (!scores || scores.length === 0) continue;

    const userSet = new Set(scores.map(s => s.score_value));
    let matches = winningNumbers.filter(n => userSet.has(n)).length;

    if (matches >= 3) {
      rawWinners.push({ user_id: user.id, email: user.email, match_count: matches });
    }
  }

  // PRIZE CALCULATION LOGIC
  const t1Total = (poolSize * 0.40) + rolloverAmount;
  const t1Count = rawWinners.filter(w => w.match_count === 5).length;
  const t1Prize = t1Count > 0 ? (t1Total / t1Count) : 0;

  const t2Count = rawWinners.filter(w => w.match_count === 4).length;
  const t2Prize = t2Count > 0 ? (poolSize * 0.35 / t2Count) : 0;

  const t3Count = rawWinners.filter(w => w.match_count === 3).length;
  const t3Prize = t3Count > 0 ? (poolSize * 0.25 / t3Count) : 0;

  const winnersWithPrizes = rawWinners.map(w => ({
    ...w,
    prize: w.match_count === 5 ? t1Prize : w.match_count === 4 ? t2Prize : t3Prize
  }));

  return {
    winningNumbers,
    poolSize,
    rolloverAmount,
    winners: winnersWithPrizes,
    newRollover: t1Count === 0 ? t1Total : 0
  };
};

// 4. EXPORTED ENDPOINTS
export const simulateDraw = async (req, res) => {
  try {
    const results = await _runDrawAlgorithm(req.body.mode || 'random');
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const commitDraw = async (req, res) => {
  try {
    const results = await _runDrawAlgorithm(req.body.mode || 'random');
    const { data: draw, error: drawError } = await supabase.from('draws').insert({
      winning_numbers: results.winningNumbers,
      pool_size: results.poolSize,
      status: 'published'
    }).select().single();

    if (drawError) throw drawError;

    for (const w of results.winners) {
      await supabase.from('winners').insert({
        draw_id: draw.id,
        user_id: w.user_id,
        match_count: w.match_count,
        prize_amount: w.prize, // Uses pre-calculated prize including rollover
        status: 'pending'
      });
    }

    await supabase.from('jackpot_rollover').insert({ amount: results.newRollover });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getVerificationQueue = async (req, res) => {
  try {
    const { data: winners } = await supabase.from('winners').select('*').neq('status', 'paid');
    if (!winners) return res.json({ queue: [] });

    const queue = await Promise.all(winners.map(async (w) => {
      const { data: p } = await supabase.from('profiles').select('email').eq('id', w.user_id).single();
      return { ...w, profiles: { email: p?.email || 'Unknown' } };
    }));
    res.json({ queue });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const approvePayment = async (req, res) => {
  try {
    const { error } = await supabase.from('winners').update({ status: 'paid' }).eq('id', req.body.winnerId);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const addCharity = async (req, res) => {
  try {
    const { error } = await supabase.from('charities').insert(req.body);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteCharity = async (req, res) => {
  try {
    const { error } = await supabase.from('charities').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};