const { supabase } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token.' });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token.' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not verify session.' });
  }
};
