# Push notifications

## Mobile (Expo)

App registers Expo push token via `/notifications/devices` on launch.

## Web Push

1. Generate VAPID keys (e.g. `npx web-push generate-vapid-keys`).
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` in backend env.
3. Users enable via the site banner (service worker `/sw.js`).

## Send

Admin → Notifications, or `POST /notifications/send`.
Livestream start also notifies all registered devices.
