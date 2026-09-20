const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return json(res, 503, { error: 'LiveKit cloud environment is not configured.' });
  }
  try {
    const { roomName, identity, role } = req.body || {};
    if (!roomName || !identity || !['host', 'guest'].includes(role)) {
      return json(res, 400, { error: 'roomName, identity and role are required.' });
    }
    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const participants = await roomService.listParticipants(roomName);
    const existing = participants.find(p => p.identity === identity);
    const host = participants.find(p => {
      try { return JSON.parse(p.metadata || '{}').role === 'host'; } catch { return p.identity.startsWith('host-'); }
    });
    if (role === 'host' && host && host.identity !== identity) return json(res, 409, { error: 'This live room already has a host.' });
    if (!existing && participants.length >= 7) return json(res, 409, { error: 'Room is full. Maximum is 1 host + 6 guests.' });
    if (role === 'guest' && !host) return json(res, 409, { error: 'The host must start the live room before a guest can join.' });
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity, name: identity, metadata: JSON.stringify({ role, roomName }), ttl: '15m' });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
    return json(res, 200, { token: await token.toJwt(), wsUrl: LIVEKIT_URL, roomName, role, participantCount: participants.length + (existing ? 0 : 1) });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Could not create live room token.' });
  }
};
