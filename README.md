# Live Social App — V7 (Phone-first cloud build)

V7 prepares the project for a phone-only workflow using cloud services: Expo EAS for Android builds, LiveKit Cloud for SFU, and Vercel serverless functions for the token API.

The app target remains 1 Host + maximum 6 Guests. The mobile client must receive only short-lived room tokens; LiveKit API secrets stay on the server.

See `PHONE_CLOUD_SETUP.md` for the setup order.
