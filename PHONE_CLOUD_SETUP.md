# Phone-only cloud setup — V7

This project is prepared for a phone-first workflow: Expo EAS builds the Android APK in the cloud, and the token API can run as Vercel serverless functions. LiveKit Cloud provides the SFU. You still need to create/sign into the required cloud accounts; this archive cannot create those accounts or secrets for you.

## 1) Create LiveKit Cloud project
Create a LiveKit Cloud project and obtain its WebSocket URL, API key, and API secret. Keep the API secret private.

## 2) Deploy `cloud-api` to Vercel
Import this repository/project into Vercel, set the three LiveKit environment variables from `cloud-api/.env.example`, and deploy. Your API base URL will be the Vercel project URL.

## 3) Configure the app
Set `EXPO_PUBLIC_API_BASE_URL` in the EAS environment to the Vercel URL. Do not put the LiveKit API secret in the mobile app.

## 4) Build Android in the cloud
Use an EAS development or preview profile. The `development` and `preview` profiles are configured to produce an installable APK. EAS Build runs the native build remotely, so a laptop is not required for the build itself.

## 5) Install on Android
When the EAS build finishes, use its Install/QR flow or APK download on the Android phone.

## 6) LiveKit Expo requirement
LiveKit uses native WebRTC code and therefore is not compatible with Expo Go. The app must use an EAS development/preview build containing the LiveKit native modules.

## Security
Never ship LIVEKIT_API_SECRET in the mobile app. Only the cloud token API may access it. Add real authentication, rate limiting, abuse controls, persistent user/coin database, and monitoring before production.
