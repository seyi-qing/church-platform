# Web push (“We’re live”)

## 1. Generate VAPID keys (once)

```bash
pip install pywebpush
python -c "from py_vapid import Vapid; v=Vapid(); v.generate_keys(); print('PUBLIC', v.public_key); print('PRIVATE', v.private_key)"
```

Or:

```bash
npx web-push generate-vapid-keys
```

## 2. Set on Render (API service)

| Key | Value |
|-----|--------|
| `VAPID_PUBLIC_KEY` | public key from step 1 |
| `VAPID_PRIVATE_KEY` | private key from step 1 |
| `VAPID_CONTACT_EMAIL` | `mailto:you@yourchurch.org` |

Redeploy the API after saving.

## 3. Subscribe on the website

1. Open the public site on a phone or laptop (HTTPS / Vercel).
2. Tap **Enable notifications** (banner) or allow when prompted.
3. Browser registers a service worker (`/sw.js`) and stores a push subscription on the API.

## 4. Go live

Admin → **Livestream** → session with a **YouTube URL** → **Go live**.

- Stream appears on `/live`
- API sends push to all active devices
- Admin shows how many notifications were sent/failed

If VAPID is missing, the stream still goes live; push is skipped with a clear message.

## Notes

- Free Render cold starts can delay the first API call after idle.
- iOS Safari needs the site added to Home Screen for reliable web push on some versions.
- Demo without VAPID: live video still works; only browser alerts need keys.
