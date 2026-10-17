from datetime import date, datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession, LeaderUser, OptionalUser
from app.models.ops import Announcement, Expense
from app.services.tenant import resolve_org_id

router = APIRouter(tags=["ops"])


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    is_published: bool = True
    pinned: bool = False


class AnnouncementOut(AnnouncementCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class ExpenseCreate(BaseModel):
    title: str
    category: str = "General"
    amount_cents: int = Field(gt=0)
    expense_date: date | None = None
    notes: str | None = None


class ExpenseOut(BaseModel):
    id: int
    title: str
    category: str
    amount_cents: int
    expense_date: date
    notes: str | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


@router.get("/announcements", response_model=list[AnnouncementOut])
async def list_announcements(
    db: DbSession, published_only: bool = True, current_user: OptionalUser = None
):
    oid = await resolve_org_id(db, current_user)
    q = select(Announcement).where(Announcement.organization_id == oid).order_by(
        Announcement.pinned.desc(), Announcement.created_at.desc()
    )
    if published_only:
        q = q.where(Announcement.is_published == True)  # noqa: E712
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
async def create_announcement(payload: AnnouncementCreate, db: DbSession, current_user: LeaderUser):
    data = payload.model_dump()
    data["organization_id"] = await resolve_org_id(db, current_user)
    row = Announcement(**data)
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: int, db: DbSession, current_user: AdminUser):
    oid = await resolve_org_id(db, current_user)
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.organization_id == oid,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(row)
    await db.flush()
    return {"ok": True}


@router.get("/expenses", response_model=list[ExpenseOut])
async def list_expenses(db: DbSession, current_user: AdminUser, limit: int = 50):
    oid = await resolve_org_id(db, current_user)
    result = await db.execute(
        select(Expense)
        .where(Expense.organization_id == oid)
        .order_by(Expense.expense_date.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, db: DbSession, current_user: AdminUser):
    data = payload.model_dump()
    if not data.get("expense_date"):
        data["expense_date"] = date.today()
    data["organization_id"] = await resolve_org_id(db, current_user)
    row = Expense(**data)
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row
