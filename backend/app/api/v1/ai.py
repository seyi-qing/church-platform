"""Pastoral AI tool suite."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentUser, LeaderUser
from app.core.config import get_settings

router = APIRouter(prefix="/ai", tags=["ai tools"])
settings = get_settings()


class SummarizeRequest(BaseModel):
    transcript: str


class ChatRequest(BaseModel):
    message: str
    context: str | None = None


class SermonOutlineRequest(BaseModel):
    topic: str
    scripture: str | None = None
    length_minutes: int = 30


class PrayerRequest(BaseModel):
    situation: str
    tone: str = "compassionate"


async def _chat(system: str, user: str, max_tokens: int = 1200) -> str:
    if not settings.OPENAI_API_KEY:
        return "[AI not configured] Add OPENAI_API_KEY to enable this tool."
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {e}") from e


PASTORAL = (
    "You are a wise, biblically grounded pastoral assistant. "
    "Be warm and practical. Never replace professional counseling."
)


@router.post("/summarize")
async def summarize_sermon(payload: SummarizeRequest, _: CurrentUser):
    return {"summary": await _chat(PASTORAL + " Summarize this sermon.", payload.transcript)}


@router.post("/chat")
async def church_chat(payload: ChatRequest, _: CurrentUser):
    system = PASTORAL
    if payload.context:
        system += f"\nContext:\n{payload.context}"
    return {"reply": await _chat(system, payload.message, 800)}


@router.post("/sermon-outline")
async def sermon_outline(payload: SermonOutlineRequest, _: LeaderUser):
    user = f"Topic: {payload.topic}\nScripture: {payload.scripture or 'suggest'}\nLength: {payload.length_minutes} min"
    return {"outline": await _chat(PASTORAL + " Help prepare sermons.", user, 2000)}


@router.post("/prayer")
async def write_prayer(payload: PrayerRequest, _: CurrentUser):
    return {"prayer": await _chat(PASTORAL + " Write a prayer.", f"Tone: {payload.tone}\n{payload.situation}", 600)}


@router.get("/tools")
async def list_tools():
    return {
        "tools": [
            {"id": "summarize", "name": "Sermon summarizer"},
            {"id": "chat", "name": "Pastoral chat"},
            {"id": "sermon-outline", "name": "Sermon outline"},
            {"id": "prayer", "name": "Prayer writer"},
        ]
    }
