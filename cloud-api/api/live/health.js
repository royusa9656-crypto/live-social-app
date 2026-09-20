module.exports = async (_req, res) => {
  res.status(200).json({ ok: true, service: 'live-social-cloud-api', livekitConfigured: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) });
};
