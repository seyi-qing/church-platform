"""Groups and staff meetings API."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func

from app.api.deps import LeaderUser, DbSession
from app.models.community import ChurchGroup, GroupMember, StaffMeeting
from app.models.user import User

router = APIRouter(tags=["groups / meetings"])

GROUP_CATEGORIES = ("small_group", "team", "class", "other")
MEETING_TYPES = ("staff", "elders", "ministry", "other")
MEETING_STATUSES = ("scheduled", "completed", "cancelled")


# ---- Groups ----


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    category: str = "small_group"
    meeting_day: str | None = None
    meeting_time: str | None = None
    location: str | None = None
    leader_user_id: int | None = None
    is_active: bool = True
    max_members: int | None = None


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    meeting_day: str | None = None
    meeting_time: str | None = None
    location: str | None = None
    leader_user_id: int | None = None
    is_active: bool | None = None
    max_members: int | None = None


class GroupMemberAdd(BaseModel):
    user_id: int
    role: str = "member"
    notes: str | None = None


def _group_out(g: ChurchGroup, member_count: int = 0) -> dict:
    return {
        "id": g.id,
        "name": g.name,
        "description": g.description,
        "category": g.category,
        "meeting_day": g.meeting_day,
        "meeting_time": g.meeting_time,
        "location": g.location,
        "leader_user_id": g.leader_user_id,
        "is_active": g.is_active,
        "max_members": g.max_members,
        "member_count": member_count,
        "created_at": g.created_at.isoformat() if g.created_at else None,
    }


@router.get("/groups")
async def list_groups(db: DbSession, _: LeaderUser, active_only: bool = False):
    q = select(ChurchGroup).order_by(ChurchGroup.name)
    if active_only:
        q = q.where(ChurchGroup.is_active.is_(True))
    rows = (await db.execute(q)).scalars().all()
    out = []
    for g in rows:
        cnt = (
            await db.execute(
                select(func.count()).select_from(GroupMember).where(GroupMember.group_id == g.id)
            )
        ).scalar() or 0
        out.append(_group_out(g, int(cnt)))
    return out


@router.post("/groups", status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupCreate, db: DbSession, _: LeaderUser):
    cat = payload.category if payload.category in GROUP_CATEGORIES else "small_group"
    g = ChurchGroup(
        name=payload.name.strip(),
        description=payload.description,
        category=cat,
        meeting_day=payload.meeting_day,
        meeting_time=payload.meeting_time,
        location=payload.location,
        leader_user_id=payload.leader_user_id,
        is_active=payload.is_active,
        max_members=payload.max_members,
    )
    db.add(g)
    await db.flush()
    await db.refresh(g)
    return _group_out(g, 0)


@router.patch("/groups/{group_id}")
async def update_group(group_id: int, payload: GroupUpdate, db: DbSession, _: LeaderUser):
    g = (
        await db.execute(select(ChurchGroup).where(ChurchGroup.id == group_id))
    ).scalar_one_or_none()
    if not g:
        raise HTTPException(404, "Group not found")
    data = payload.model_dump(exclude_unset=True)
    if "category" in data and data["category"] and data["category"] not in GROUP_CATEGORIES:
        raise HTTPException(400, "Invalid category")
    if "name" in data and data["name"]:
        data["name"] = data["name"].strip()
    for k, v in data.items():
        setattr(g, k, v)
    g.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(g)
    cnt = (
        await db.execute(
            select(func.count()).select_from(GroupMember).where(GroupMember.group_id == g.id)
        )
    ).scalar() or 0
    return _group_out(g, int(cnt))


@router.delete("/groups/{group_id}")
async def delete_group(group_id: int, db: DbSession, _: LeaderUser):
    g = (
        await db.execute(select(ChurchGroup).where(ChurchGroup.id == group_id))
    ).scalar_one_or_none()
    if not g:
        raise HTTPException(404, "Group not found")
    members = (
        await db.execute(select(GroupMember).where(GroupMember.group_id == group_id))
    ).scalars().all()
    for m in members:
        await db.delete(m)
    await db.delete(g)
    await db.flush()
    return {"ok": True}


@router.get("/groups/{group_id}/members")
async def list_group_members(group_id: int, db: DbSession, _: LeaderUser):
    g = (
        await db.execute(select(ChurchGroup).where(ChurchGroup.id == group_id))
    ).scalar_one_or_none()
    if not g:
        raise HTTPException(404, "Group not found")
    rows = (
        await db.execute(select(GroupMember).where(GroupMember.group_id == group_id))
    ).scalars().all()
    out = []
    for m in rows:
        u = (await db.execute(select(User).where(User.id == m.user_id))).scalar_one_or_none()
        out.append(
            {
                "id": m.id,
                "group_id": m.group_id,
                "user_id": m.user_id,
                "role": m.role,
                "notes": m.notes,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
                "full_name": u.full_name if u else None,
                "email": u.email if u else None,
            }
        )
    return out


@router.post("/groups/{group_id}/members", status_code=status.HTTP_201_CREATED)
async def add_group_member(
    group_id: int, payload: GroupMemberAdd, db: DbSession, _: LeaderUser
):
    g = (
        await db.execute(select(ChurchGroup).where(ChurchGroup.id == group_id))
    ).scalar_one_or_none()
    if not g:
        raise HTTPException(404, "Group not found")
    user = (await db.execute(select(User).where(User.id == payload.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    existing = (
        await db.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id, GroupMember.user_id == payload.user_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "User already in this group")
    m = GroupMember(
        group_id=group_id,
        user_id=payload.user_id,
        role=payload.role if payload.role in ("member", "leader", "helper") else "member",
        notes=payload.notes,
    )
    db.add(m)
    await db.flush()
    await db.refresh(m)
    return {
        "id": m.id,
        "group_id": m.group_id,
        "user_id": m.user_id,
        "role": m.role,
        "full_name": user.full_name,
        "email": user.email,
    }


@router.delete("/groups/{group_id}/members/{member_id}")
async def remove_group_member(
    group_id: int, member_id: int, db: DbSession, _: LeaderUser
):
    m = (
        await db.execute(
            select(GroupMember).where(
                GroupMember.id == member_id, GroupMember.group_id == group_id
            )
        )
    ).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Membership not found")
    await db.delete(m)
    await db.flush()
    return {"ok": True}


# ---- Meetings ----


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


@router.get("/meetings")
async def list_meetings(db: DbSession, _: LeaderUser, status_filter: str | None = None):
    q = select(StaffMeeting).order_by(StaffMeeting.start_at.desc())
    if status_filter and status_filter in MEETING_STATUSES:
        q = q.where(StaffMeeting.status == status_filter)
    rows = (await db.execute(q.limit(100))).scalars().all()
    return [_meeting_out(m) for m in rows]


@router.post("/meetings", status_code=status.HTTP_201_CREATED)
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


@router.patch("/meetings/{meeting_id}")
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


@router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: int, db: DbSession, _: LeaderUser):
    m = (
        await db.execute(select(StaffMeeting).where(StaffMeeting.id == meeting_id))
    ).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Meeting not found")
    await db.delete(m)
    await db.flush()
    return {"ok": True}
