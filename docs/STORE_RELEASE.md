# App Store / Play Store release path

## 1. Assets

Place under `mobile/assets/`:

- `icon.png` — 1024×1024
- `adaptive-icon.png` — 1024×1024 (Android)
- `splash.png` — ~1284×2778 or similar

Until real art exists, Expo will warn; generate simple brand squares in any design tool.

## 2. EAS

```bash
cd mobile
npm install -g eas-cli
eas login
eas init   # sets projectId in app.json

# Preview APK
eas build --profile preview --platform android

# Production
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

Set `EXPO_PUBLIC_API_URL` to your production API in EAS secrets.

## 3. Store review checklist

- Privacy policy URL
- Account deletion path (profile / support email)
- Push permission rationale
- Screenshots for phone sizes
- No placeholder “test” content on production API

This repo is **ready to wire into EAS**; final icons and Apple/Google accounts are on you.
