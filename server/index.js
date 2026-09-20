const express = require('express');
const cors = require('cors');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 8788);
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

function requireConfig(res) {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    res.status(503).json({ error: 'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET.' });
    return false;
  }
  return true;
}

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

app.get('/health', async (_req, res) => {
  res.json({ ok: true, service: 'live-social-api', livekitConfigured: Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET) });
});

app.post('/api/live/token', async (req, res) => {
  try {
    if (!requireConfig(res)) return;
    const { roomName, identity, role } = req.body || {};
    if (!roomName || !identity || !['host', 'guest'].includes(role)) {
      return res.status(400).json({ error: 'roomName, identity and role are required.' });
    }

    const participants = await roomService.listParticipants(roomName);
    const existing = participants.find(p => p.identity === identity);
    const host = participants.find(p => {
      try { return JSON.parse(p.metadata || '{}').role === 'host'; } catch { return p.identity.startsWith('host-'); }
    });

    if (role === 'host' && host && host.identity !== identity) {
      return res.status(409).json({ error: 'This live room already has a host.' });
    }
    if (!existing && participants.length >= 7) {
      return res.status(409).json({ error: 'Room is full. Maximum is 1 host + 6 guests.' });
    }
    if (role === 'guest' && !host) {
      return res.status(409).json({ error: 'The host must start the live room before a guest can join.' });
    }

    const metadata = JSON.stringify({ role, roomName });
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: identity,
      metadata,
      ttl: '15m'
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    return res.json({ token: await token.toJwt(), wsUrl: LIVEKIT_URL, roomName, role, participantCount: participants.length + (existing ? 0 : 1) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not create live room token.' });
  }
});

app.post('/api/live/end', async (req, res) => {
  try {
    if (!requireConfig(res)) return;
    const { roomName, identity } = req.body || {};
    if (!roomName || !identity) return res.status(400).json({ error: 'roomName and identity are required.' });
    const participants = await roomService.listParticipants(roomName);
    const host = participants.find(p => {
      try { return JSON.parse(p.metadata || '{}').role === 'host'; } catch { return false; }
    });
    if (!host || host.identity !== identity) return res.status(403).json({ error: 'Only the host can end the live room.' });
    await roomService.deleteRoom(roomName);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not end live room.' });
  }
});

app.listen(PORT, () => console.log(`Live Social API listening on :${PORT}`));
