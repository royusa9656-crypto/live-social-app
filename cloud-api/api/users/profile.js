const { supabase } = require('../../lib/supabase');

async function getUser(req) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) return null;

  const token = authorization.slice(7).trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

module.exports = async function handler(req, res) {
  try {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      return res.status(200).json({
        ok: true,
        profile: data
      });
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = req.body || {};
      const username = String(body.username || '').trim();
      const displayName = String(body.display_name || '').trim();
      const avatarUrl = String(body.avatar_url || '').trim();

      if (!username) {
        return res.status(400).json({ error: 'username is required.' });
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          display_name: displayName || null,
          avatar_url: avatarUrl || null
        })
        .select('id, username, display_name, avatar_url, created_at')
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Username is already taken.' });
        }
        throw error;
      }

      return res.status(200).json({
        ok: true,
        profile: data
      });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not process profile.' });
  }
};
