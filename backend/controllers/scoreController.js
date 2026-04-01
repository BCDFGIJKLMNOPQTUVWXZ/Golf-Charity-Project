import { supabase } from '../supabaseClient.js';

export const addScore = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted strictly from token
    const { scoreValue } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (typeof scoreValue !== 'number' || scoreValue < 1 || scoreValue > 45) {
      return res.status(400).json({ error: 'scoreValue must be a number between 1 and 45' });
    }

    // Query the scores table for the userId
    const { data: userScores, error: fetchError } = await supabase
      .from('scores')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }); // oldest first

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    // If the user already has 5 or more scores, delete the oldest ones to make room
    if (userScores && userScores.length >= 5) {
      const recordsToDelete = userScores.slice(0, userScores.length - 4);
      for (const record of recordsToDelete) {
        await supabase.from('scores').delete().eq('id', record.id);
      }
    }

    // Insert the new score
    const { error: insertError } = await supabase
      .from('scores')
      .insert({ user_id: userId, score_value: scoreValue });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    // Response: Return the updated list of the 5 most recent scores
    const { data: updatedScores, error: readError } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (readError) {
      return res.status(500).json({ error: readError.message });
    }

    return res.status(200).json({ scores: updatedScores });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserScores = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted strictly from token
    
    const { data: scores, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ scores });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
