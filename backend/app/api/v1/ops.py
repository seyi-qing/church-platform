from datetime import date, datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession, LeaderUser
from app.models.ops import Announcement, Expense

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
    notes: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


@router.get("/announcements", response_model=list[AnnouncementOut])
async def list_announcements(db: DbSession, published_only: bool = True):
    q = select(Announcement).order_by(
        Announcement.pinned.desc(), Announcement.created_at.desc()
    )
    if published_only:
        q = q.where(Announcement.is_published == True)  # noqa: E712
    return (await db.execute(q.limit(50))).scalars().all()


@router.post("/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
async def create_announcement(payload: AnnouncementCreate, db: DbSession, _: LeaderUser):
    row = Announcement(**payload.model_dump())
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: int, db: DbSession, _: AdminUser):
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Not found")
    await db.delete(row)
    await db.flush()
    return {"ok": True}


@router.get("/expenses", response_model=list[ExpenseOut])
async def list_expenses(db: DbSession, _: AdminUser, limit: int = 50):
    result = await db.execute(
        select(Expense).order_by(Expense.expense_date.desc()).limit(limit)
    )
    return result.scalars().all()


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, db: DbSession, _: AdminUser):
    data = payload.model_dump()
    if not data.get("expense_date"):
        data["expense_date"] = date.today()
    row = Expense(**data)
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row
