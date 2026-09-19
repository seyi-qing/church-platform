from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, LeaderUser
from app.models.member import Attendance, Family, Group, GroupMembership, MemberProfile
from app.models.user import User
from app.schemas.member import (
    AttendanceCreate,
    FamilyCreate,
    FamilyOut,
    GroupCreate,
    GroupMembershipCreate,
    GroupOut,
    MemberProfileCreate,
    MemberProfileOut,
)
from app.schemas.user import UserCreate, UserOut
from app.core.security import get_password_hash

router = APIRouter(prefix="/members", tags=["members / ChMS"])


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: DbSession, _: AdminUser):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role or "member",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut])
async def list_users(db: DbSession, _: LeaderUser, skip: int = 0, limit: int = 50):
    result = await db.execute(select(User).offset(skip).limit(limit).order_by(User.id.desc()))
    return result.scalars().all()


@router.post("/families", response_model=FamilyOut, status_code=status.HTTP_201_CREATED)
async def create_family(payload: FamilyCreate, db: DbSession, _: LeaderUser):
    family = Family(**payload.model_dump())
    db.add(family)
    await db.flush()
    await db.refresh(family)
    return family


@router.get("/families", response_model=list[FamilyOut])
async def list_families(db: DbSession, _: LeaderUser):
    result = await db.execute(select(Family).order_by(Family.name))
    return result.scalars().all()


@router.post("/profiles", response_model=MemberProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(payload: MemberProfileCreate, db: DbSession, _: LeaderUser):
    result = await db.execute(select(MemberProfile).where(MemberProfile.user_id == payload.user_id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Profile already exists")
    profile = MemberProfile(**payload.model_dump())
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.get("/profiles", response_model=list[MemberProfileOut])
async def list_profiles(db: DbSession, _: LeaderUser, skip: int = 0, limit: int = 50):
    result = await db.execute(select(MemberProfile).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupCreate, db: DbSession, _: LeaderUser):
    group = Group(**payload.model_dump())
    db.add(group)
    await db.flush()
    await db.refresh(group)
    return group


@router.get("/groups", response_model=list[GroupOut])
async def list_groups(db: DbSession):
    result = await db.execute(select(Group).order_by(Group.name))
    return result.scalars().all()


@router.post("/groups/memberships", status_code=status.HTTP_201_CREATED)
async def add_membership(payload: GroupMembershipCreate, db: DbSession, _: LeaderUser):
    m = GroupMembership(**payload.model_dump())
    db.add(m)
    await db.flush()
    return {"ok": True, "id": m.id}


@router.post("/attendance", status_code=status.HTTP_201_CREATED)
async def check_in(payload: AttendanceCreate, db: DbSession, current_user: LeaderUser):
    att = Attendance(
        event_id=payload.event_id,
        member_id=payload.member_id,
        checked_in_by=current_user.id,
        notes=payload.notes,
    )
    db.add(att)
    await db.flush()
    return {"ok": True, "id": att.id}
