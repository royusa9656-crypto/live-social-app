const { supabase } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const search = String(req.query?.search || '').trim();

    let query = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .order('username', { ascending: true })
      .limit(30);

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Could not load users.'
      });
    }

    return res.status(200).json({
      ok: true,
      users: data || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Could not load users.'
    });
  }
};
