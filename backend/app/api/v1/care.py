from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import DbSession, LeaderUser
from app.models.care import CareFollowUp, CareNote, CareRequest
from app.services.tenant import resolve_org_id

router = APIRouter(prefix="/care", tags=["pastoral care"])


class CareRequestCreate(BaseModel):
    member_id: int | None = None
    campus_id: int | None = None
    requester_name: str = Field(min_length=1, max_length=255)
    requester_email: str | None = None
    requester_phone: str | None = None
    category: str = "general"
    priority: str = "normal"
    summary: str
    details: str | None = None
    is_confidential: bool = True
    assigned_to: int | None = None
    due_date: str | None = None


class CareRequestUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_to: int | None = None
    summary: str | None = None
    details: str | None = None
    is_confidential: bool | None = None


class CareRequestOut(BaseModel):
    id: int
    member_id: int | None = None
    campus_id: int | None = None
    requester_name: str
    requester_email: str | None = None
    requester_phone: str | None = None
    category: str
    priority: str
    status: str
    summary: str
    details: str | None = None
    assigned_to: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


@router.post("/requests", response_model=CareRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(payload: CareRequestCreate, db: DbSession, current_user: LeaderUser):
    oid = await resolve_org_id(db, current_user)
    data = payload.model_dump()
    due = data.pop("due_date", None)
    req = CareRequest(**data, created_by=current_user.id, organization_id=oid)
    if due:
        try:
            from datetime import date as date_cls

            req.due_date = date_cls.fromisoformat(str(due)[:10])
        except Exception:
            pass
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return req


@router.get("/requests", response_model=list[CareRequestOut])
async def list_requests(
    db: DbSession, current_user: LeaderUser, status_filter: str | None = None, limit: int = 50
):
    oid = await resolve_org_id(db, current_user)
    q = select(CareRequest).where(CareRequest.organization_id == oid)
    if status_filter:
        q = q.where(CareRequest.status == status_filter)
    result = await db.execute(q.order_by(CareRequest.created_at.desc()).limit(limit))
    return result.scalars().all()


@router.patch("/requests/{request_id}", response_model=CareRequestOut)
async def update_request(
    request_id: int, payload: CareRequestUpdate, db: DbSession, current_user: LeaderUser
):
    oid = await resolve_org_id(db, current_user)
    result = await db.execute(
        select(CareRequest).where(
            CareRequest.id == request_id, CareRequest.organization_id == oid
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Care request not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(req, k, v)
    if payload.status == "resolved" and not req.resolved_at:
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
        note=payload.get("note") or "",
        is_private=bool(payload.get("is_private", True)),
    )
    db.add(note)
    await db.flush()
    return {"ok": True, "id": note.id}


@router.get("/board")
async def care_board(db: DbSession, current_user: LeaderUser, campus_id: int | None = None):
    oid = await resolve_org_id(db, current_user)
    q = select(CareRequest).where(CareRequest.organization_id == oid)
    if campus_id:
        q = q.where(CareRequest.campus_id == campus_id)
    result = await db.execute(q.order_by(CareRequest.created_at.desc()))
    rows = result.scalars().all()
    open_rows = [r for r in rows if r.status in ("open", "new")]
    assigned = [r for r in rows if r.status == "assigned"]
    resolved = [r for r in rows if r.status in ("resolved", "closed")]
    return {
        "open": open_rows,
        "assigned": assigned,
        "resolved": resolved,
        "total": len(rows),
    }
