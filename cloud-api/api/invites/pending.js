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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const { data, error } = await supabase
      .from('live_invites')
      .select('id, room_name, inviter_id, invitee_id, status, created_at')
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      invites: data || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Could not load pending invitations.'
    });
  }
};
