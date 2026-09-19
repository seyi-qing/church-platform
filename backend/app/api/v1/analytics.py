from datetime import datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import AdminUser, DbSession
from app.models.event import EventRegistration
from app.models.giving import Donation
from app.models.media import MediaItem
from app.models.member import Attendance, MemberProfile
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def overview(db: DbSession, _: AdminUser, days: int = 30):
    since = datetime.utcnow() - timedelta(days=days)
    users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    members = (await db.execute(select(func.count()).select_from(MemberProfile))).scalar() or 0
    donations_q = await db.execute(
        select(func.coalesce(func.sum(Donation.amount_cents), 0)).where(
            Donation.status == "succeeded",
            Donation.created_at >= since,
        )
    )
    giving_cents = donations_q.scalar() or 0
    media = (await db.execute(select(func.count()).select_from(MediaItem).where(MediaItem.is_published == True))).scalar() or 0  # noqa: E712
    attendance = (await db.execute(select(func.count()).select_from(Attendance).where(Attendance.checked_in_at >= since))).scalar() or 0
    registrations = (await db.execute(select(func.count()).select_from(EventRegistration).where(EventRegistration.registered_at >= since))).scalar() or 0
    return {
        "days": days,
        "users": users,
        "members": members,
        "giving_cents": giving_cents,
        "media_published": media,
        "attendance": attendance,
        "event_registrations": registrations,
    }


@router.get("/giving-by-fund")
async def giving_by_fund(db: DbSession, _: AdminUser, days: int = 30):
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Donation.fund, func.sum(Donation.amount_cents))
        .where(Donation.status == "succeeded", Donation.created_at >= since)
        .group_by(Donation.fund)
    )
    return [{"fund": r[0], "amount_cents": int(r[1] or 0)} for r in result.all()]
