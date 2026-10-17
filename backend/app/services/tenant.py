from contextvars import ContextVar
from sqlalchemy import Select, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.user import User

DEFAULT_SLUG = "grace"

# Set by FastAPI middleware from X-Tenant-Slug / ?tenant=
_request_tenant_slug: ContextVar[str | None] = ContextVar("request_tenant_slug", default=None)


def set_request_tenant_slug(slug: str | None) -> None:
    _request_tenant_slug.set((slug or "").strip().lower() or None)


def get_request_tenant_slug() -> str | None:
    return _request_tenant_slug.get()


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


async def get_org_by_slug(db: AsyncSession, slug: str | None) -> Organization | None:
    if not slug:
        return None
    s = slug.strip().lower()
    if not s or s in ("www", "api", "app", "platform", "admin"):
        return None
    return (
        await db.execute(select(Organization).where(Organization.slug == s))
    ).scalar_one_or_none()


async def resolve_org_id(
    db: AsyncSession,
    user: User | None,
    *,
    tenant_slug: str | None = None,
) -> int:
    """Active tenant for this request.

    Priority:
    1. Authenticated user.organization_id (Act-as / church staff)
    2. Explicit tenant_slug arg or request ContextVar (subdomain / header)
    3. Default Grace
    """
    if user is not None and user.organization_id is not None:
        return int(user.organization_id)
    slug = tenant_slug or get_request_tenant_slug()
    if slug:
        org = await get_org_by_slug(db, slug)
        if org and org.is_active:
            return int(org.id)
    org = await get_default_org(db)
    return int(org.id)


def scope_query(query: Select, column, org_id: int) -> Select:
    return query.where(column == org_id)


async def backfill_org_ids(db: AsyncSession, org_id: int) -> dict[str, int]:
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
        "groups",
        "care_requests",
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
