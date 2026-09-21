from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, LeaderUser
from app.models.livestream import LivestreamSession
from app.models.notification import PushDevice
from app.schemas.livestream import LivestreamCreate, LivestreamOut, LivestreamUpdate
from app.services import mux as mux_service
from app.services import push as push_service

router = APIRouter(prefix="/livestream", tags=["livestream"])


@router.post("/sessions", response_model=LivestreamOut, status_code=status.HTTP_201_CREATED)
async def create_session(payload: LivestreamCreate, db: DbSession, _: LeaderUser):
    mux_data = None
    try:
        mux_data = await mux_service.create_live_stream(title=payload.title)
    except Exception:
        mux_data = None

    session = LivestreamSession(
        title=payload.title,
        description=payload.description,
        scheduled_start=payload.scheduled_start,
        youtube_url=payload.youtube_url,
        is_public=payload.is_public,
        status="scheduled",
        mux_live_stream_id=mux_data["live_stream_id"] if mux_data else None,
        mux_playback_id=mux_data["playback_id"] if mux_data else None,
        stream_key=mux_data["stream_key"] if mux_data else None,
        playback_url=(mux_data["playback_url"] if mux_data else payload.youtube_url),
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/sessions", response_model=list[LivestreamOut])
async def list_sessions(db: DbSession, status_filter: str | None = None):
    query = select(LivestreamSession)
    if status_filter:
        query = query.where(LivestreamSession.status == status_filter)
    result = await db.execute(
        query.order_by(LivestreamSession.id.desc())
    )
    return result.scalars().all()


@router.get("/sessions/live", response_model=LivestreamOut | None)
async def get_current_live(db: DbSession):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.status == "live").limit(1)
    )
    return result.scalar_one_or_none()


@router.get("/sessions/{session_id}", response_model=LivestreamOut)
async def get_session(session_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.patch("/sessions/{session_id}", response_model=LivestreamOut)
async def update_session(
    session_id: int, payload: LivestreamUpdate, db: DbSession, _: LeaderUser
):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(session, k, v)
    if "youtube_url" in data and data["youtube_url"]:
        session.playback_url = data["youtube_url"]
    await db.flush()
    await db.refresh(session)
    return session


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.flush()
    return {"ok": True}


@router.post("/sessions/{session_id}/start", response_model=LivestreamOut)
async def start_session(session_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "live"
    session.actual_start = datetime.utcnow()
    await db.flush()
    await db.refresh(session)

    try:
        tokens_q = await db.execute(
            select(PushDevice.token).where(PushDevice.is_active == True)  # noqa: E712
        )
        tokens = [r[0] for r in tokens_q.all()]
        if tokens:
            await push_service.notify_devices(
                tokens,
                title="We're live!",
                body=session.title or "Join us for worship",
                data={"screen": "live", "session_id": str(session.id)},
            )
    except Exception:
        pass

    return session


@router.post("/sessions/{session_id}/end", response_model=LivestreamOut)
async def end_session(session_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(
        select(LivestreamSession).where(LivestreamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "ended"
    await db.flush()
    await db.refresh(session)
    return session
