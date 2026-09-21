"""Optional email (Resend) and SMS (Twilio) delivery."""

from __future__ import annotations

import httpx

from app.core.config import get_settings


def email_configured() -> bool:
    s = get_settings()
    return bool(s.RESEND_API_KEY)


def sms_configured() -> bool:
    s = get_settings()
    return bool(s.TWILIO_ACCOUNT_SID and s.TWILIO_AUTH_TOKEN and s.TWILIO_FROM_NUMBER)


async def send_email_batch(
    to_addresses: list[str], subject: str, body: str
) -> dict:
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        return {
            "sent": 0,
            "failed": len(to_addresses),
            "errors": ["RESEND_API_KEY not set on API"],
            "configured": False,
        }
    sent = failed = 0
    errors: list[str] = []
    async with httpx.AsyncClient(timeout=30) as client:
        for addr in to_addresses:
            if not addr or "@" not in addr:
                failed += 1
                continue
            try:
                r = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": settings.EMAIL_FROM,
                        "to": [addr],
                        "subject": subject,
                        "text": body,
                    },
                )
                if r.status_code in (200, 201):
                    sent += 1
                else:
                    failed += 1
                    errors.append(f"{addr}: {r.status_code} {r.text[:120]}")
            except Exception as e:
                failed += 1
                errors.append(f"{addr}: {str(e)[:120]}")
    return {
        "sent": sent,
        "failed": failed,
        "errors": errors[:8],
        "configured": True,
    }


async def send_sms_batch(to_numbers: list[str], body: str) -> dict:
    settings = get_settings()
    if not sms_configured():
        return {
            "sent": 0,
            "failed": len(to_numbers),
            "errors": ["Twilio not configured (SID, token, from number)"],
            "configured": False,
        }
    sent = failed = 0
    errors: list[str] = []
    auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    url = (
        f"https://api.twilio.com/2010-04-01/Accounts/"
        f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    )
    async with httpx.AsyncClient(timeout=30) as client:
        for num in to_numbers:
            n = (num or "").strip()
            if not n:
                failed += 1
                continue
            try:
                r = await client.post(
                    url,
                    auth=auth,
                    data={"From": settings.TWILIO_FROM_NUMBER, "To": n, "Body": body[:1500]},
                )
                if r.status_code in (200, 201):
                    sent += 1
                else:
                    failed += 1
                    errors.append(f"{n}: {r.status_code} {r.text[:120]}")
            except Exception as e:
                failed += 1
                errors.append(f"{n}: {str(e)[:120]}")
    return {
        "sent": sent,
        "failed": failed,
        "errors": errors[:8],
        "configured": True,
    }
