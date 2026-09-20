const { supabase } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inviteId, inviteeId, accepted } = req.body || {};

    if (!inviteId || !inviteeId || typeof accepted !== 'boolean') {
      return res.status(400).json({
        error: 'inviteId, inviteeId and accepted are required.'
      });
    }

    const status = accepted ? 'accepted' : 'rejected';

    const { data, error } = await supabase
      .from('live_invites')
      .update({
        status,
        responded_at: new Date().toISOString()
      })
      .eq('id', inviteId)
      .eq('invitee_id', inviteeId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Could not respond to live invite.'
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Invite not found or already responded to.'
      });
    }

    return res.status(200).json({
      ok: true,
      invite: data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Could not respond to live invite.'
    });
  }
};
