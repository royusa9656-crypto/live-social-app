const { RoomServiceClient } = require('@livekit/server-sdk');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return res.status(503).json({ error: 'LiveKit cloud environment is not configured.' });
  try {
    const { roomName, identity } = req.body || {};
    if (!roomName || !identity) return res.status(400).json({ error: 'roomName and identity are required.' });
    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const participants = await roomService.listParticipants(roomName);
    const host = participants.find(p => {
      try { return JSON.parse(p.metadata || '{}').role === 'host'; } catch { return p.identity.startsWith('host-'); }
    });
    if (!host || host.identity !== identity) return res.status(403).json({ error: 'Only the host can end the room.' });
    await roomService.deleteRoom(roomName);
    return res.status(200).json({ ok: true, roomName });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Could not end live room.' });
  }
};
