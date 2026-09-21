# Grace Church mobile (Expo)

The `mobile/` folder is an Expo Router app aimed at App Store / Play Store later.

## Run locally

```bash
cd mobile
npm install
# Point at your API (Render URL)
export EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
npx expo start
```

Scan the QR code with Expo Go (dev), or build with EAS when ready for stores.

## Screens

- Tabs: Home, Sermons, Live, Events, Give, More
- Login + secure token storage
- Offline cache helpers in `lib/offline.ts`
- Push registration helper in `lib/push.ts`

## Not yet App Store “finished”

- App icons / splash assets per brand
- EAS project + store listings
- Full offline sync for giving/RSVP
- Native video player polish

Ship web first; use this shell when the API is always-on and content is stable.
