const { supabase } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { id, username, displayName, avatarUrl } = req.body || {};

      if (!id || !username) {
        return res.status(400).json({
          error: 'id and username are required.'
        });
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id,
          username,
          display_name: displayName || null,
          avatar_url: avatarUrl || null
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        return res.status(500).json({
          error: 'Could not save profile.'
        });
      }

      return res.status(200).json({
        ok: true,
        profile: data
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Could not save profile.'
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const username = req.query?.username;

      if (!username) {
        return res.status(400).json({
          error: 'username is required.'
        });
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        return res.status(404).json({
          error: 'Profile not found.'
        });
      }

      return res.status(200).json({
        ok: true,
        profile: data
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Could not load profile.'
      });
    }
  }

  return res.status(405).json({
    error: 'Method not allowed'
  });
};
