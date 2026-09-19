"""Expo + Web Push notification service."""
from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import get_settings

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
CHUNK_SIZE = 100
settings = get_settings()


def is_expo_token(token: str) -> bool:
    return token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")


def is_web_subscription(token: str) -> bool:
    if not token or not token.strip().startswith("{"):
        return False
    try:
        data = json.loads(token)
        return bool(data.get("endpoint") and data.get("keys"))
    except Exception:
        return False


async def send_expo_push(
    tokens: list[str],
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    valid = [t for t in tokens if t and is_expo_token(t)]
    if not valid:
        return {"sent": 0, "failed": 0, "errors": []}
    messages = [
        {"to": t, "title": title, "body": body, "sound": "default", "priority": "high", "data": data or {}}
        for t in valid
    ]
    sent = failed = 0
    errors: list[str] = []
    async with httpx.AsyncClient(timeout=30) as client:
        for i in range(0, len(messages), CHUNK_SIZE):
            chunk = messages[i : i + CHUNK_SIZE]
            try:
                res = await client.post(EXPO_PUSH_URL, json=chunk, headers={"Content-Type": "application/json"})
                res.raise_for_status()
                for ticket in (res.json().get("data") or []):
                    if isinstance(ticket, dict) and ticket.get("status") == "ok":
                        sent += 1
                    else:
                        failed += 1
            except Exception as e:
                failed += len(chunk)
                errors.append(str(e))
    return {"sent": sent, "failed": failed, "errors": errors[:20]}


def send_web_push_sync(subscription_json: str, title: str, body: str, data: dict | None = None) -> tuple[bool, str | None]:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return False, "VAPID keys not configured"
    try:
        from pywebpush import webpush
        webpush(
            subscription_info=json.loads(subscription_json),
            data=json.dumps({"title": title, "body": body, "data": data or {}}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_CONTACT_EMAIL},
        )
        return True, None
    except Exception as e:
        return False, str(e)


async def send_web_push_batch(tokens: list[str], title: str, body: str, data: dict | None = None) -> dict[str, Any]:
    import asyncio
    web_tokens = [t for t in tokens if is_web_subscription(t)]
    sent = failed = 0
    errors: list[str] = []
    gone: list[str] = []
    loop = asyncio.get_event_loop()
    for token in web_tokens:
        ok, err = await loop.run_in_executor(None, send_web_push_sync, token, title, body, data)
        if ok:
            sent += 1
        else:
            failed += 1
            if err:
                errors.append(err[:200])
                if "410" in err or "Gone" in err:
                    gone.append(token)
    return {"sent": sent, "failed": failed, "errors": errors, "gone_tokens": gone}


async def notify_devices(tokens: list[str], title: str, body: str, data: dict | None = None) -> dict[str, Any]:
    expo = await send_expo_push(tokens, title, body, data)
    web = await send_web_push_batch(tokens, title, body, data)
    return {
        "sent": expo["sent"] + web["sent"],
        "failed": expo["failed"] + web["failed"],
        "errors": (expo.get("errors") or []) + (web.get("errors") or []),
        "gone_tokens": web.get("gone_tokens") or [],
    }


def get_vapid_public_key() -> str | None:
    return settings.VAPID_PUBLIC_KEY
