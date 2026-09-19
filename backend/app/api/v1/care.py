from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import DbSession, LeaderUser
from app.models.care import CareFollowUp, CareNote, CareRequest

router = APIRouter(prefix="/care", tags=["pastoral care"])


class CareRequestCreate(BaseModel):
    member_id: int | None = None
    campus_id: int | None = None
    requester_name: str
    requester_email: str | None = None
    requester_phone: str | None = None
    category: str = "general"
    priority: str = "normal"
    summary: str
    details: str | None = None
    is_confidential: bool = True
    assigned_to: int | None = None


class CareRequestUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_to: int | None = None
    summary: str | None = None
    details: str | None = None


class CareRequestOut(BaseModel):
    id: int
    member_id: int | None
    campus_id: int | None
    requester_name: str
    category: str
    priority: str
    status: str
    summary: str
    assigned_to: int | None
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/requests", response_model=CareRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(payload: CareRequestCreate, db: DbSession, current_user: LeaderUser):
    req = CareRequest(**payload.model_dump(), created_by=current_user.id)
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return req


@router.get("/requests", response_model=list[CareRequestOut])
async def list_requests(db: DbSession, _: LeaderUser, status_filter: str | None = None, limit: int = 50):
    q = select(CareRequest)
    if status_filter:
        q = q.where(CareRequest.status == status_filter)
    result = await db.execute(q.order_by(CareRequest.created_at.desc()).limit(limit))
    return result.scalars().all()


@router.patch("/requests/{request_id}", response_model=CareRequestOut)
async def update_request(request_id: int, payload: CareRequestUpdate, db: DbSession, _: LeaderUser):
    result = await db.execute(select(CareRequest).where(CareRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(req, k, v)
    if payload.status in ("resolved", "closed") and not req.resolved_at:
        req.resolved_at = datetime.utcnow()
    await db.flush()
    await db.refresh(req)
    return req


@router.post("/notes", status_code=status.HTTP_201_CREATED)
async def add_note(payload: dict, db: DbSession, current_user: LeaderUser):
    note = CareNote(
        care_request_id=payload.get("care_request_id"),
        member_id=payload.get("member_id"),
        author_id=current_user.id,
        note=payload["note"],
        is_private=payload.get("is_private", True),
    )
    db.add(note)
    await db.flush()
    return {"ok": True, "id": note.id}


@router.get("/workflow/board")
async def care_board(db: DbSession, _: LeaderUser, campus_id: int | None = None):
    q = select(CareRequest)
    if campus_id:
        q = q.where(CareRequest.campus_id == campus_id)
    result = await db.execute(q.order_by(CareRequest.created_at.desc()))
    items = result.scalars().all()
    board = {"open": [], "assigned": [], "in_progress": [], "resolved": [], "closed": []}
    for item in items:
        bucket = item.status if item.status in board else "open"
        board[bucket].append({
            "id": item.id,
            "requester_name": item.requester_name,
            "category": item.category,
            "priority": item.priority,
            "summary": item.summary,
            "assigned_to": item.assigned_to,
        })
    return board
