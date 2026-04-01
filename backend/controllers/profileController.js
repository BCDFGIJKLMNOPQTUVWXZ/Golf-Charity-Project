import { supabase } from '../supabaseClient.js';

export const selectCharity = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted strictly from token
    const { charityId, donationPercent } = req.body;

    if (!userId || charityId === undefined || donationPercent === undefined) {
      return res.status(400).json({ error: 'userId, charityId, and donationPercent are required' });
    }

    if (Number(donationPercent) < 10) {
      return res.status(400).json({ error: 'donationPercent must be at least 10%' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        favorite_charity_id: charityId, 
        donation_percent: Number(donationPercent),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Upsert Error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Profile updated successfully', profile: data });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted strictly from token
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If the error is 'PGRST116' (No rows found), it means the profile doesn't exist yet. That's fine.
      if (error.code === 'PGRST116') {
         return res.status(200).json({ profile: null });
      }
      console.error('Fetch Profile Error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getWinnerStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find latest draw
    const { data: draw, error: drawErr } = await supabase
      .from('draws')
      .select('id, draw_date')
      .order('draw_date', { ascending: false })
      .limit(1)
      .single();

    if (drawErr && drawErr.code !== 'PGRST116') throw drawErr;
    if (!draw) return res.status(200).json({ isWinner: false });

    // Find if user is in winners for this latest draw
    const { data: winner, error: winnerErr } = await supabase
      .from('winners')
      .select('*')
      .eq('draw_id', draw.id)
      .eq('user_id', userId)
      .single();

    if (winnerErr && winnerErr.code !== 'PGRST116') throw winnerErr;

    if (winner) {
      return res.status(200).json({ 
        isWinner: true, 
        winnerId: winner.id, 
        prizeAmount: winner.prize_amount, 
        matchCount: winner.match_count, 
        status: winner.status 
      });
    }

    return res.status(200).json({ isWinner: false });
  } catch (err) {
    console.error('Error fetching winner status:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
