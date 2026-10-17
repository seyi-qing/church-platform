from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, LeaderUser, OptionalUser
from app.services.tenant import resolve_org_id
from app.core.security import get_password_hash
from app.models.event import Event, EventRegistration
from app.models.member import MemberProfile
from app.models.user import User
from app.schemas.event import EventCreate, EventOut, EventRegistrationCreate, EventRegistrationOut

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: DbSession, current_user: LeaderUser):
    data = payload.model_dump()
    try:
        data["organization_id"] = await resolve_org_id(db, current_user)
    except Exception:
        pass
    event = Event(**data, created_by=current_user.id)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


@router.get("", response_model=list[EventOut])
async def list_events(
    db: DbSession,
    public_only: bool = True,
    limit: int = 50,
    current_user: OptionalUser = None,
):
    q = select(Event)
    if public_only:
        q = q.where(Event.is_public == True)  # noqa: E712
    try:
        oid = await resolve_org_id(db, current_user)
        q = q.where((Event.organization_id == oid) | (Event.organization_id.is_(None)))
    except Exception:
        pass
    result = await db.execute(q.order_by(Event.start_at.desc()).limit(limit))
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: int, db: DbSession):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
