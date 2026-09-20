const { supabase } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomName, inviterId, inviteeId } = req.body || {};

    if (!roomName || !inviterId || !inviteeId) {
      return res.status(400).json({
        error: 'roomName, inviterId and inviteeId are required.'
      });
    }

    const { data, error } = await supabase
      .from('live_invites')
      .insert({
        room_name: roomName,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Could not create live invite.' });
    }

    return res.status(201).json({
      ok: true,
      invite: data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not create live invite.' });
  }
};
