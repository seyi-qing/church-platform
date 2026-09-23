"""Public contact form + staff inquiry inbox."""

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select

from app.api.deps import LeaderUser, DbSession
from app.models.inquiry import ContactInquiry
from app.models.user import User
from app.models.member import MemberProfile
from app.models.care import CareRequest
from app.core.security import get_password_hash
from app.services.email_sms import send_email_batch, email_configured
import secrets

router = APIRouter(prefix="/inquiries", tags=["contact / inquiries"])

TOPICS = ("general", "visit", "prayer", "give", "other")
STATUSES = ("new", "in_progress", "resolved", "spam")


class InquiryCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    topic: str = "general"
    subject: str = Field(default="", max_length=255)
    message: str = Field(min_length=5, max_length=5000)


class InquiryUpdate(BaseModel):
    status: str | None = None
    staff_notes: str | None = None
    assigned_to: int | None = None


class InquiryReply(BaseModel):
    body: str = Field(min_length=2, max_length=5000)


def _serialize(row: ContactInquiry) -> dict:
    return {
        "id": row.id,
        "full_name": row.full_name,
        "email": row.email,
        "phone": row.phone,
        "topic": row.topic,
        "subject": row.subject,
        "message": row.message,
        "status": row.status,
        "staff_notes": row.staff_notes,
        "assigned_to": row.assigned_to,
        "follow_up_created": row.follow_up_created,
        "care_request_id": row.care_request_id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_inquiry(payload: InquiryCreate, db: DbSession, request: Request):
    """Public endpoint — no auth. Stores inquiry for staff inbox."""
    topic = payload.topic if payload.topic in TOPICS else "general"
    email = str(payload.email).lower().strip()

    # Simple rate limit: same email within 2 minutes
    since = datetime.utcnow() - timedelta(minutes=2)
    recent = await db.execute(
        select(ContactInquiry)
        .where(ContactInquiry.email == email, ContactInquiry.created_at >= since)
        .limit(1)
    )
    if recent.scalar_one_or_none():
        raise HTTPException(
            status_code=429,
            detail="Please wait a moment before sending another message.",
        )

    row = ContactInquiry(
        full_name=payload.full_name.strip(),
        email=email,
        phone=(payload.phone or "").strip() or None,
        topic=topic,
        subject=(payload.subject or "").strip(),
        message=payload.message.strip(),
        status="new",
        ip_address=(request.client.host if request.client else None),
        user_agent=(request.headers.get("user-agent") or "")[:500] or None,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)

    # Optional: notify staff if Resend is configured
    if email_configured():
        try:
            staff_q = await db.execute(
                select(User.email).where(
                    User.is_active.is_(True),
                    User.role.in_(["admin", "pastor", "leader", "secretary"]),
                )
            )
            staff_emails = [e for (e,) in staff_q.all() if e]
            if staff_emails:
                subject = f"New contact inquiry: {row.full_name}"
                body = (
                    f"From: {row.full_name} <{row.email}>\n"
                    f"Phone: {row.phone or '—'}\n"
                    f"Topic: {row.topic}\n"
                    f"Subject: {row.subject or '—'}\n\n"
                    f"{row.message}\n\n"
                    f"Open Admin → Inquiries to reply and manage."
                )
                await send_email_batch(staff_emails[:10], subject, body)
        except Exception:
            pass

    return _serialize(row)


@router.get("")
async def list_inquiries(
    db: DbSession,
    _: LeaderUser,
    status_filter: str | None = None,
):
    q = select(ContactInquiry).order_by(ContactInquiry.created_at.desc())
    if status_filter and status_filter in STATUSES:
        q = q.where(ContactInquiry.status == status_filter)
    result = await db.execute(q.limit(200))
    return [_serialize(r) for r in result.scalars().all()]


@router.get("/{inquiry_id}")
async def get_inquiry(inquiry_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(select(ContactInquiry).where(ContactInquiry.id == inquiry_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return _serialize(row)


@router.patch("/{inquiry_id}")
async def update_inquiry(
    inquiry_id: int, payload: InquiryUpdate, db: DbSession, _: LeaderUser
):
    result = await db.execute(select(ContactInquiry).where(ContactInquiry.id == inquiry_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        if data["status"] not in STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        row.status = data["status"]
    if "staff_notes" in data:
        row.staff_notes = data["staff_notes"]
    if "assigned_to" in data:
        row.assigned_to = data["assigned_to"]
    row.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(row)
    return _serialize(row)


@router.post("/{inquiry_id}/reply")
async def reply_to_inquiry(
    inquiry_id: int, payload: InquiryReply, db: DbSession, current_user: LeaderUser
):
    """Email a reply to the contact and log it in staff notes."""
    result = await db.execute(select(ContactInquiry).where(ContactInquiry.id == inquiry_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    body = payload.body.strip()
    if len(body) < 2:
        raise HTTPException(status_code=400, detail="Reply message is too short")

    if not email_configured():
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Set RESEND_API_KEY (and EMAIL_FROM) on the API host, then try again.",
        )

    staff_name = current_user.full_name or current_user.email or "Grace Church"
    subject_bit = (row.subject or row.topic or "your message").strip()
    subject = f"Re: {subject_bit} — Grace Church"

    created = row.created_at.strftime("%Y-%m-%d") if row.created_at else "recently"
    email_body = (
        f"Hello {row.full_name},\n\n"
        f"{body}\n\n"
        f"— {staff_name}\n"
        f"Grace Church\n\n"
        f"---\n"
        f"This is a reply to your message from {created}:\n"
        f"{(row.message or '')[:400]}\n"
    )

    send_result = await send_email_batch([row.email], subject, email_body)
    if not send_result.get("sent"):
        err = "; ".join(send_result.get("errors") or ["Email send failed"])
        raise HTTPException(status_code=502, detail=f"Could not send email: {err}")

    stamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    log_line = f"\n\n--- Reply sent {stamp} by {staff_name} ---\n{body}"
    row.staff_notes = (row.staff_notes or "") + log_line
    if row.status == "new":
        row.status = "in_progress"
    row.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(row)

    return {
        "ok": True,
        "email_sent": True,
        "to": row.email,
        "inquiry": _serialize(row),
    }


@router.post("/{inquiry_id}/visitor-follow-up", status_code=status.HTTP_201_CREATED)
async def create_visitor_from_inquiry(
    inquiry_id: int, db: DbSession, current_user: LeaderUser
):
    """Turn inquiry into visitor profile + open care follow-up."""
    result = await db.execute(select(ContactInquiry).where(ContactInquiry.id == inquiry_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    email = row.email.lower().strip()
    existing = await db.execute(select(User).where(User.email == email))
    user = existing.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(secrets.token_urlsafe(24)),
            full_name=row.full_name,
            phone=row.phone,
            role="member",
            is_active=True,
        )
        db.add(user)
        await db.flush()
    else:
        if row.phone and not getattr(user, "phone", None):
            user.phone = row.phone

    prof_q = await db.execute(select(MemberProfile).where(MemberProfile.user_id == user.id))
    profile = prof_q.scalar_one_or_none()
    if not profile:
        profile = MemberProfile(
            user_id=user.id,
            membership_status="visitor",
            notes=f"From contact inquiry #{row.id}: {row.subject or row.topic}\n{row.message[:500]}",
        )
        db.add(profile)
        await db.flush()
    else:
        if profile.membership_status not in ("member", "active"):
            profile.membership_status = "visitor"

    care = CareRequest(
        member_id=profile.id,
        requester_name=row.full_name,
        requester_email=email,
        requester_phone=row.phone,
        category="visitor" if row.topic == "visit" else "inquiry",
        priority="normal",
        status="open",
        summary=f"Contact inquiry: {row.subject or row.topic}",
        details=row.message,
        created_by=current_user.id,
    )
    db.add(care)
    await db.flush()

    row.follow_up_created = True
    row.care_request_id = care.id
    if row.status == "new":
        row.status = "in_progress"
    row.updated_at = datetime.utcnow()
    await db.flush()

    return {
        "ok": True,
        "user_id": user.id,
        "profile_id": profile.id,
        "care_request_id": care.id,
        "inquiry": _serialize(row),
    }


@router.delete("/{inquiry_id}")
async def delete_inquiry(inquiry_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(select(ContactInquiry).where(ContactInquiry.id == inquiry_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    await db.delete(row)
    await db.flush()
    return {"ok": True}
