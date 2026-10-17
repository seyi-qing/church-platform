"""Tenant / organization API — multi-tenant foundation."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession, OptionalUser
from app.models.organization import Organization

router = APIRouter(prefix="/tenants", tags=["tenants"])

DEFAULT_SLUG = "grace"


class OrgOut(BaseModel):
    id: int
    name: str
    slug: str
    tagline: str | None = None
    primary_color: str
    logo_url: str | None = None
    timezone: str
    service_times: str | None = None
    address: str | None = None
    plan: str
    is_active: bool

    model_config = {"from_attributes": True}


class OrgUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    tagline: str | None = None
    primary_color: str | None = None
    logo_url: str | None = None
    timezone: str | None = None
    service_times: str | None = None
    address: str | None = None


async def ensure_default_org(db: DbSession) -> Organization:
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
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


@router.get("/current", response_model=OrgOut)
async def current_tenant(db: DbSession, _: OptionalUser = None):
    """Public: brand + service info for the active church (single-tenant default)."""
    org = await ensure_default_org(db)
    return org


@router.get("", response_model=list[OrgOut])
async def list_tenants(db: DbSession, _: AdminUser):
    rows = (await db.execute(select(Organization).order_by(Organization.name))).scalars().all()
    if not rows:
        return [await ensure_default_org(db)]
    return list(rows)


@router.patch("/current", response_model=OrgOut)
async def update_current_tenant(payload: OrgUpdate, db: DbSession, _: AdminUser):
    org = await ensure_default_org(db)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(org, k, v)
    await db.flush()
    await db.refresh(org)
    return org
