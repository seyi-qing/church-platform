"""Staff / leadership meetings API."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import LeaderUser, DbSession
from app.models.community import StaffMeeting

router = APIRouter(prefix="/meetings", tags=["meetings"])

MEETING_TYPES = ("staff", "elders", "ministry", "other")
MEETING_STATUSES = ("scheduled", "completed", "cancelled")


class MeetingCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    meeting_type: str = "staff"
    location: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    agenda: str | None = None
    notes: str | None = None
    status: str = "scheduled"


class MeetingUpdate(BaseModel):
    title: str | None = None
    meeting_type: str | None = None
    location: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    agenda: str | None = None
    notes: str | None = None
    status: str | None = None


def _meeting_out(m: StaffMeeting) -> dict:
    return {
        "id": m.id,
        "title": m.title,
        "meeting_type": m.meeting_type,
        "location": m.location,
        "start_at": m.start_at.isoformat() if m.start_at else None,
        "end_at": m.end_at.isoformat() if m.end_at else None,
        "agenda": m.agenda,
        "notes": m.notes,
        "status": m.status,
        "created_by": m.created_by,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.get("")
async def list_meetings(db: DbSession, _: LeaderUser, status_filter: str | None = None):
    q = select(StaffMeeting).order_by(StaffMeeting.start_at.desc())
    if status_filter and status_filter in MEETING_STATUSES:
        q = q.where(StaffMeeting.status == status_filter)
    rows = (await db.execute(q.limit(100))).scalars().all()
    return [_meeting_out(m) for m in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meeting(payload: MeetingCreate, db: DbSession, current_user: LeaderUser):
    mt = payload.meeting_type if payload.meeting_type in MEETING_TYPES else "staff"
    st = payload.status if payload.status in MEETING_STATUSES else "scheduled"
    m = StaffMeeting(
        title=payload.title.strip(),
        meeting_type=mt,
        location=payload.location,
        start_at=payload.start_at,
        end_at=payload.end_at,
        agenda=payload.agenda,
        notes=payload.notes,
        status=st,
        created_by=current_user.id,
    )
    db.add(m)
    await db.flush()
    await db.refresh(m)
    return _meeting_out(m)


@router.patch("/{meeting_id}")
async def update_meeting(
    meeting_id: int, payload: MeetingUpdate, db: DbSession, _: LeaderUser
):
    m = (
        await db.execute(select(StaffMeeting).where(StaffMeeting.id == meeting_id))
    ).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Meeting not found")
    data = payload.model_dump(exclude_unset=True)
    if "meeting_type" in data and data["meeting_type"] and data["meeting_type"] not in MEETING_TYPES:
        raise HTTPException(400, "Invalid meeting type")
    if "status" in data and data["status"] and data["status"] not in MEETING_STATUSES:
        raise HTTPException(400, "Invalid status")
    if "title" in data and data["title"]:
        data["title"] = data["title"].strip()
    for k, v in data.items():
        setattr(m, k, v)
    m.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(m)
    return _meeting_out(m)


@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: int, db: DbSession, _: LeaderUser):
    m = (
        await db.execute(select(StaffMeeting).where(StaffMeeting.id == meeting_id))
    ).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Meeting not found")
    await db.delete(m)
    await db.flush()
    return {"ok": True}
