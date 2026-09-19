"""Mux livestream helper."""
from __future__ import annotations

import base64
from typing import Any

import httpx

from app.core.config import get_settings

settings = get_settings()
MUX_API = "https://api.mux.com/video/v1"


def _auth_header() -> str | None:
    if not settings.MUX_TOKEN_ID or not settings.MUX_TOKEN_SECRET:
        return None
    raw = f"{settings.MUX_TOKEN_ID}:{settings.MUX_TOKEN_SECRET}"
    return "Basic " + base64.b64encode(raw.encode()).decode()


async def create_live_stream(title: str = "Church Livestream") -> dict[str, Any] | None:
    auth = _auth_header()
    if not auth:
        return None
    payload = {
        "playback_policy": ["public"],
        "new_asset_settings": {"playback_policy": ["public"]},
        "reduced_latency": True,
        "passthrough": title[:128],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{MUX_API}/live-streams",
            json=payload,
            headers={"Authorization": auth, "Content-Type": "application/json"},
        )
        res.raise_for_status()
        data = res.json()["data"]
    playback_ids = data.get("playback_ids") or []
    playback_id = playback_ids[0]["id"] if playback_ids else None
    return {
        "live_stream_id": data["id"],
        "stream_key": data.get("stream_key"),
        "playback_id": playback_id,
        "playback_url": f"https://stream.mux.com/{playback_id}.m3u8" if playback_id else None,
        "rtmps_url": "rtmps://global-live.mux.com:443/app",
    }


async def end_live_stream(live_stream_id: str) -> bool:
    auth = _auth_header()
    if not auth:
        return False
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.put(
            f"{MUX_API}/live-streams/{live_stream_id}/complete",
            headers={"Authorization": auth},
        )
        return res.is_success
