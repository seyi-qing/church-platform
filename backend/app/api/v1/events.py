from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, LeaderUser, OptionalUser
from app.core.security import get_password_hash
from app.models.event import Event, EventRegistration
from app.models.member import MemberProfile
from app.models.user import User
from app.schemas.event import EventCreate, EventOut, EventRegistrationCreate
import secrets

router = APIRouter(prefix="/events", tags=["events"])


class GuestRsvp(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    notes: str | None = None


class RegistrationOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: str
    notes: str | None
    registered_at: str
    full_name: str | None = None
    email: str | None = None


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: DbSession, current_user: LeaderUser):
    event = Event(**payload.model_dump(), created_by=current_user.id)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


@router.get("", response_model=list[EventOut])
async def list_events(db: DbSession, public_only: bool = True, limit: int = 50):
    q = select(Event)
    if public_only:
        q = q.where(Event.is_public == True)  # noqa: E712
    result = await db.execute(q.order_by(Event.start_at.desc()).limit(limit))
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
    ev = await db.execute(select(Event).where(Event.id == payload.event_id))
    if not ev.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
    existing = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == payload.event_id,
            EventRegistration.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"ok": True, "already": True, "message": "Already registered"}
    reg = EventRegistration(
        event_id=payload.event_id,
        user_id=current_user.id,
        notes=payload.notes,
    )
    db.add(reg)
    await db.flush()
    return {"ok": True, "id": reg.id}


@router.post("/{event_id}/rsvp", status_code=status.HTTP_201_CREATED)
async def rsvp_event(
    event_id: int,
    payload: GuestRsvp,
    db: DbSession,
    current_user: OptionalUser = None,
):
    """Public one-tap RSVP — works logged-in or as guest (name + email)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    user = current_user
    if user is None:
        email = str(payload.email).lower().strip()
        found = await db.execute(select(User).where(User.email == email))
        user = found.scalar_one_or_none()
        if not user:
            user = User(
                email=email,
                hashed_password=get_password_hash(secrets.token_urlsafe(24)),
                full_name=payload.name.strip(),
                role="member",
                is_active=True,
            )
            db.add(user)
            await db.flush()
            db.add(
                MemberProfile(
                    user_id=user.id,
                    membership_status="visitor",
                    notes="RSVP guest",
                )
            )
            await db.flush()

    existing = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        return {
            "ok": True,
            "already": True,
            "message": "You're already on the list",
            "event_title": event.title,
        }

    note = payload.notes
    if not current_user:
        note = (f"Guest RSVP: {payload.name}" + (f" — {payload.notes}" if payload.notes else ""))[
            :250
        ]

    reg = EventRegistration(event_id=event_id, user_id=user.id, notes=note)
    db.add(reg)
    await db.flush()
    return {
        "ok": True,
        "id": reg.id,
        "event_title": event.title,
        "message": "You're registered — see you there!",
    }


@router.get("/{event_id}/registrations")
async def list_registrations(event_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(
        select(EventRegistration, User)
        .join(User, User.id == EventRegistration.user_id)
        .where(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.registered_at.desc())
    )
    rows = []
    for reg, user in result.all():
        rows.append(
            {
                "id": reg.id,
                "event_id": reg.event_id,
                "user_id": reg.user_id,
                "status": reg.status,
                "notes": reg.notes,
                "registered_at": reg.registered_at.isoformat() if reg.registered_at else None,
                "full_name": user.full_name,
                "email": user.email,
            }
        )
    return rows
