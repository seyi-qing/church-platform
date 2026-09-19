from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession, LeaderUser
from app.models.campus import Campus

router = APIRouter(prefix="/campuses", tags=["campuses"])


class CampusCreate(BaseModel):
    name: str
    slug: str
    address: str | None = None
    city: str | None = None
    timezone: str = "America/New_York"
    phone: str | None = None
    email: str | None = None
    is_primary: bool = False


class CampusOut(CampusCreate):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


@router.post("", response_model=CampusOut, status_code=status.HTTP_201_CREATED)
async def create_campus(payload: CampusCreate, db: DbSession, _: AdminUser):
    existing = await db.execute(select(Campus).where(Campus.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")
    campus = Campus(**payload.model_dump())
    db.add(campus)
    await db.flush()
    await db.refresh(campus)
    return campus


@router.get("", response_model=list[CampusOut])
async def list_campuses(db: DbSession, active_only: bool = True):
    q = select(Campus)
    if active_only:
        q = q.where(Campus.is_active == True)  # noqa: E712
    result = await db.execute(q.order_by(Campus.is_primary.desc(), Campus.name))
    return result.scalars().all()


@router.patch("/{campus_id}", response_model=CampusOut)
async def update_campus(campus_id: int, payload: CampusCreate, db: DbSession, _: AdminUser):
    result = await db.execute(select(Campus).where(Campus.id == campus_id))
    campus = result.scalar_one_or_none()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    for k, v in payload.model_dump().items():
        setattr(campus, k, v)
    await db.flush()
    await db.refresh(campus)
    return campus
