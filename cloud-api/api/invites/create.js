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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const { room_name, invitee_id } = req.body || {};

    if (!room_name || !invitee_id) {
      return res.status(400).json({
        error: 'room_name and invitee_id are required.'
      });
    }

    if (invitee_id === user.id) {
      return res.status(400).json({
        error: 'You cannot invite yourself.'
      });
    }

    const { data, error } = await supabase
      .from('live_invites')
      .insert({
        room_name: String(room_name),
        inviter_id: user.id,
        invitee_id: String(invitee_id),
        status: 'pending'
      })
      .select('id, room_name, inviter_id, invitee_id, status, created_at')
      .single();

    if (error) throw error;

    return res.status(201).json({
      ok: true,
      invite: data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Could not create live invitation.'
    });
  }
};
