"""Multi-tenant helpers: resolve org and HARD scope queries."""

from sqlalchemy import Select, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.user import User

DEFAULT_SLUG = "grace"


async def get_default_org(db: AsyncSession) -> Organization:
    row = (
        await db.execute(select(Organization).where(Organization.slug == DEFAULT_SLUG))
    ).scalar_one_or_none()
    if row:
        return row
    any_org = (await db.execute(select(Organization).limit(1))).scalar_one_or_none()
    if any_org:
        return any_org
    org = Organization(
        name="Grace Church",
        slug=DEFAULT_SLUG,
        tagline="A community following Jesus together",
        primary_color="#1d4ed8",
        timezone="Africa/Kampala",
        service_times="Sundays · 10:00 AM",
        address="Kampala, Uganda",
        plan="starter",
        is_active=True,
        subscription_status="trial",
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


async def resolve_org_id(db: AsyncSession, user: User | None) -> int:
    """Active tenant for this request.

    - User with organization_id (including after Act-as) → that org
    - Anonymous public → default Grace (until subdomain routing)
    """
    if user is not None and user.organization_id is not None:
        return int(user.organization_id)
    org = await get_default_org(db)
    return int(org.id)


def scope_query(query: Select, column, org_id: int) -> Select:
    """HARD isolation: only rows for this organization_id."""
    return query.where(column == org_id)


async def backfill_org_ids(db: AsyncSession, org_id: int) -> dict[str, int]:
    """Assign null organization_id rows to the given church (Grace once at bootstrap)."""
    tables = [
        "users",
        "media_items",
        "series",
        "events",
        "announcements",
        "gallery_photos",
        "contact_inquiries",
        "livestream_sessions",
        "donations",
        "expenses",
    ]
    counts: dict[str, int] = {}
    for table in tables:
        try:
            result = await db.execute(
                text(
                    f"UPDATE {table} SET organization_id = :oid "
                    f"WHERE organization_id IS NULL"
                ),
                {"oid": org_id},
            )
            counts[table] = result.rowcount or 0
        except Exception as e:
            counts[table] = -1
            print(f"[tenant] backfill skip {table}: {e}")
    await db.flush()
    return counts
