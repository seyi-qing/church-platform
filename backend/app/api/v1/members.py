from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import or_, select

from app.core.security import get_password_hash
from app.api.deps import AdminUser, CurrentUser, DbSession, LeaderUser
from app.models.member import Attendance, Family, Group, GroupMembership, MemberProfile
from app.models.user import User
from app.models.care import CareRequest
from app.schemas.user import UserOut, UserCreateStaff
from app.schemas.member import (
    AttendanceCreate,
    FamilyCreate,
    FamilyOut,
    GroupCreate,
    GroupMembershipCreate,
    GroupOut,
    MemberProfileCreate,
    MemberProfileOut,
    MemberProfileUpdate,
)
import secrets

router = APIRouter(prefix="/members", tags=["members / ChMS"])


class VisitorCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = None
    notes: str | None = None
    create_follow_up: bool = True
    assign_to: int | None = None


@router.get("/users", response_model=list[UserOut])
async def list_users(db: DbSession, _: AdminUser, skip: int = 0, limit: int = 100):
    result = await db.execute(select(User).order_by(User.id).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/directory")
async def member_directory(
    db: DbSession, _: LeaderUser, q: str = "", limit: int = 30
):
    """Search people by name or email for attendance check-in."""
    query = (
        select(User, MemberProfile)
        .outerjoin(MemberProfile, MemberProfile.user_id == User.id)
        .where(User.is_active == True)  # noqa: E712
        .order_by(User.full_name)
        .limit(limit)
    )
    term = (q or "").strip()
    if term:
        like = f"%{term}%"
        query = query.where(
            or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like))
        )
    result = await db.execute(query)
    rows = []
    for user, profile in result.all():
        rows.append(
            {
                "user_id": user.id,
                "profile_id": profile.id if profile else None,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "membership_status": profile.membership_status if profile else "active",
            }
        )
    return rows


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user_staff(payload: UserCreateStaff, db: DbSession, _: AdminUser):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    role = (
        payload.role
        if payload.role in ("member", "leader", "secretary", "pastor", "admin")
        else "member"
    )
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    db.add(MemberProfile(user_id=user.id, membership_status="active"))
    await db.flush()
    return user


@router.post("/visitors", status_code=status.HTTP_201_CREATED)
async def create_visitor(payload: VisitorCreate, db: DbSession, current_user: LeaderUser):
    """Capture a visitor and optionally open a pastoral follow-up."""
    email = (str(payload.email).lower().strip() if payload.email else None)
    if not email:
        slug = secrets.token_hex(4)
        email = f"visitor.{slug}@grace.local"

    existing = await db.execute(select(User).where(User.email == email))
    user = existing.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(secrets.token_urlsafe(24)),
            full_name=payload.full_name.strip(),
            phone=payload.phone,
            role="member",
            is_active=True,
        )
        db.add(user)
        await db.flush()
    else:
        if payload.phone and not user.phone:
            user.phone = payload.phone
        if payload.full_name and user.full_name != payload.full_name:
            user.full_name = payload.full_name.strip()

    prof_q = await db.execute(select(MemberProfile).where(MemberProfile.user_id == user.id))
    profile = prof_q.scalar_one_or_none()
    if not profile:
        profile = MemberProfile(
            user_id=user.id,
            membership_status="visitor",
            notes=payload.notes,
        )
        db.add(profile)
        await db.flush()
    else:
        profile.membership_status = "visitor"
        if payload.notes:
            profile.notes = (
                (profile.notes or "") + ("\n" if profile.notes else "") + payload.notes
            )

    follow_up_id = None
    if payload.create_follow_up:
        req = CareRequest(
            member_id=profile.id,
            requester_name=payload.full_name.strip(),
            requester_email=email if not email.endswith("@grace.local") else None,
            requester_phone=payload.phone,
            category="visitor",
            priority="normal",
            status="open",
            summary=f"New visitor follow-up: {payload.full_name.strip()}",
            details=payload.notes,
            assigned_to=payload.assign_to,
            created_by=current_user.id,
        )
        if payload.assign_to:
            req.status = "assigned"
        db.add(req)
        await db.flush()
        follow_up_id = req.id

    await db.flush()
    return {
        "ok": True,
        "user_id": user.id,
        "profile_id": profile.id,
        "follow_up_id": follow_up_id,
        "email": email,
    }


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
        raise HTTPException(status_code=400, detail="Profile already exists for this user")
    profile = MemberProfile(**payload.model_dump())
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.get("/profiles", response_model=list[MemberProfileOut])
async def list_profiles(db: DbSession, _: LeaderUser, skip: int = 0, limit: int = 50):
    result = await db.execute(
        select(MemberProfile).offset(skip).limit(limit).order_by(MemberProfile.id)
    )
    return result.scalars().all()


@router.get("/profiles/{profile_id}", response_model=MemberProfileOut)
async def get_profile(profile_id: int, db: DbSession, current_user: CurrentUser):
    result = await db.execute(select(MemberProfile).where(MemberProfile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if current_user.role == "member" and profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    return profile


@router.patch("/profiles/{profile_id}", response_model=MemberProfileOut)
async def update_profile(
    profile_id: int, payload: MemberProfileUpdate, db: DbSession, _: LeaderUser
):
    result = await db.execute(select(MemberProfile).where(MemberProfile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.get("/me/profile", response_model=MemberProfileOut)
async def get_my_profile(db: DbSession, current_user: CurrentUser):
    result = await db.execute(
        select(MemberProfile).where(MemberProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = MemberProfile(user_id=current_user.id, membership_status="active")
        db.add(profile)
        await db.flush()
        await db.refresh(profile)
    return profile


@router.patch("/me/profile", response_model=MemberProfileOut)
async def update_my_profile(
    payload: MemberProfileUpdate, db: DbSession, current_user: CurrentUser
):
    result = await db.execute(
        select(MemberProfile).where(MemberProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = MemberProfile(user_id=current_user.id, membership_status="active")
        db.add(profile)
        await db.flush()
    data = payload.model_dump(exclude_unset=True)
    allowed = {"address", "notes", "birthdate", "baptism_date", "photo_url"}
    for k, v in data.items():
        if k in allowed:
            setattr(profile, k, v)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.post("/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupCreate, db: DbSession, _: LeaderUser):
    group = Group(**payload.model_dump())
    db.add(group)
    await db.flush()
    await db.refresh(group)
    return group


@router.get("/groups", response_model=list[GroupOut])
async def list_groups(db: DbSession, current_user: CurrentUser, public_only: bool = False):
    query = select(Group)
    if public_only or current_user.role == "member":
        query = query.where(Group.is_public == True)  # noqa: E712
    result = await db.execute(query.order_by(Group.name))
    return result.scalars().all()


@router.post("/groups/{group_id}/members", status_code=status.HTTP_201_CREATED)
async def add_group_member(
    group_id: int, payload: GroupMembershipCreate, db: DbSession, _: LeaderUser
):
    membership = GroupMembership(
        group_id=group_id,
        member_id=payload.member_id,
        role=payload.role,
    )
    db.add(membership)
    await db.flush()
    return {"ok": True, "id": membership.id}


@router.post("/attendance", status_code=status.HTTP_201_CREATED)
async def record_attendance(
    payload: AttendanceCreate, db: DbSession, current_user: LeaderUser
):
    profile = await db.execute(
        select(MemberProfile).where(MemberProfile.id == payload.member_id)
    )
    if not profile.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Member profile not found")
    row = Attendance(
        **payload.model_dump(),
        checked_in_by=current_user.id,
    )
    db.add(row)
    await db.flush()
    return {"ok": True, "id": row.id}


@router.get("/attendance")
async def list_attendance(db: DbSession, _: LeaderUser, limit: int = 100):
    result = await db.execute(
        select(Attendance, MemberProfile, User)
        .join(MemberProfile, MemberProfile.id == Attendance.member_id)
        .join(User, User.id == MemberProfile.user_id)
        .order_by(Attendance.checked_in_at.desc())
        .limit(limit)
    )
    return [
        {
            "id": r.id,
            "event_id": r.event_id,
            "member_id": r.member_id,
            "full_name": u.full_name,
            "email": u.email,
            "checked_in_at": r.checked_in_at,
            "notes": r.notes,
        }
        for r, _p, u in result.all()
    ]
