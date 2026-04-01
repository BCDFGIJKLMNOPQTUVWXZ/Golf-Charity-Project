import { supabase } from '../supabaseClient.js';

export const getCharities = async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = supabase.from('charities').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      // Use PostgreSQL ILIKE for case-insensitive search
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const makeOneOffDonation = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted strictly from token
    const { charityId, amount } = req.body;

    if (!userId || !charityId || !amount) {
      return res.status(400).json({ error: 'userId, charityId, and amount are required' });
    }

    const { data: charity, error: fetchError } = await supabase
      .from('charities')
      .select('total_impact_raised')
      .eq('id', charityId)
      .single();

    if (fetchError) {
      console.error('Fetch Error:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    const newTotal = (Number(charity.total_impact_raised) || 0) + Number(amount);

    const { data: updatedCharity, error: updateError } = await supabase
      .from('charities')
      .update({ total_impact_raised: newTotal })
      .eq('id', charityId)
      .select()
      .single();

    if (updateError) {
      console.error('Update Error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ message: 'Donation recorded successfully', charity: updatedCharity });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
