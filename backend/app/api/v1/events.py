from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, LeaderUser
from app.models.event import Event, EventRegistration
from app.schemas.event import EventCreate, EventOut, EventRegistrationCreate

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: DbSession, current_user: LeaderUser):
    event = Event(**payload.model_dump(), created_by=current_user.id)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


@router.get("", response_model=list[EventOut])
async def list_events(db: DbSession, public_only: bool = True):
    q = select(Event)
    if public_only:
        q = q.where(Event.is_public == True)  # noqa: E712
    result = await db.execute(q.order_by(Event.start_at.desc()))
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: int, db: DbSession):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_for_event(
    payload: EventRegistrationCreate, db: DbSession, current_user: CurrentUser
):
    reg = EventRegistration(
        event_id=payload.event_id,
        user_id=current_user.id,
        notes=payload.notes,
    )
    db.add(reg)
    await db.flush()
    return {"ok": True, "id": reg.id}
