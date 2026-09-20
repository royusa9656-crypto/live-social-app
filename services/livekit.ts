import { Room, RoomEvent, Track } from 'livekit-client';

export type LiveRole = 'host' | 'guest';

export async function fetchLiveKitToken(apiBaseUrl: string, roomName: string, identity: string, role: LiveRole) {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/live/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roomName, identity, role }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ token: string; wsUrl: string; role: LiveRole; roomName: string }>;
}

export async function connectLiveRoom(wsUrl: string, token: string) {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: { resolution: { width: 720, height: 1280 }, facingMode: 'user' },
    publishDefaults: { simulcast: true },
  });
  await room.connect(wsUrl, token, { autoSubscribe: true });
  return room;
}

export { RoomEvent, Track };
