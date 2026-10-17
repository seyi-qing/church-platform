"""Tenant / organization API — multi-tenant foundation + platform super-admin."""

import re

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OptionalUser
from app.models.organization import Organization
from app.models.user import User

router = APIRouter(prefix="/tenants", tags=["tenants"])

DEFAULT_SLUG = "grace"
PLANS = ("starter", "growth", "pro")


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
    plan: str | None = None
    is_active: bool | None = None


class OrgCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=100)
    tagline: str | None = None
    timezone: str = "Africa/Kampala"
    service_times: str | None = "Sundays · 10:00 AM"
    address: str | None = None
    plan: str = "starter"
    primary_color: str = "#1d4ed8"


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return (s or "church")[:80]


def _require_superuser(user: User) -> None:
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform super-admin only",
        )


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
async def current_tenant(db: DbSession, _user: OptionalUser = None):
    """Public: brand + service info for the active church (single-tenant default)."""
    org = await ensure_default_org(db)
    return org


@router.get("", response_model=list[OrgOut])
async def list_tenants(db: DbSession, current_user: CurrentUser):
    """Church admins see current; platform superusers see all tenants."""
    if current_user.is_superuser:
        rows = (
            await db.execute(select(Organization).order_by(Organization.name))
        ).scalars().all()
        if not rows:
            return [await ensure_default_org(db)]
        return list(rows)
    # Tenant staff: only their org (or default)
    if current_user.organization_id:
        row = (
            await db.execute(
                select(Organization).where(Organization.id == current_user.organization_id)
            )
        ).scalar_one_or_none()
        if row:
            return [row]
    return [await ensure_default_org(db)]


@router.post("", response_model=OrgOut, status_code=status.HTTP_201_CREATED)
async def create_tenant(payload: OrgCreate, db: DbSession, current_user: CurrentUser):
    """Platform super-admin: provision a new church tenant."""
    _require_superuser(current_user)
    slug = (payload.slug or _slugify(payload.name)).lower().strip()
    slug = re.sub(r"[^a-z0-9-]", "", slug) or "church"
    plan = payload.plan if payload.plan in PLANS else "starter"

    existing = (
        await db.execute(select(Organization).where(Organization.slug == slug))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail=f"Slug '{slug}' already taken")

    org = Organization(
        name=payload.name.strip(),
        slug=slug,
        tagline=payload.tagline,
        primary_color=payload.primary_color or "#1d4ed8",
        timezone=payload.timezone or "Africa/Kampala",
        service_times=payload.service_times,
        address=payload.address,
        plan=plan,
        is_active=True,
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


@router.patch("/current", response_model=OrgOut)
async def update_current_tenant(payload: OrgUpdate, db: DbSession, current_user: AdminUser):
    """Church admin updates branding of the default / their org."""
    if current_user.organization_id and not current_user.is_superuser:
        org = (
            await db.execute(
                select(Organization).where(Organization.id == current_user.organization_id)
            )
        ).scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
    else:
        org = await ensure_default_org(db)

    data = payload.model_dump(exclude_unset=True)
    # Plan changes: superuser only
    if "plan" in data:
        if not current_user.is_superuser:
            data.pop("plan")
        elif data["plan"] not in PLANS:
            raise HTTPException(status_code=400, detail=f"Plan must be one of {PLANS}")
    if "is_active" in data and not current_user.is_superuser:
        data.pop("is_active")

    for k, v in data.items():
        setattr(org, k, v)
    await db.flush()
    await db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrgOut)
async def get_tenant(org_id: int, db: DbSession, current_user: CurrentUser):
    _require_superuser(current_user)
    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/{org_id}", response_model=OrgOut)
async def update_tenant(
    org_id: int, payload: OrgUpdate, db: DbSession, current_user: CurrentUser
):
    """Platform super-admin: edit any tenant including plan and active flag."""
    _require_superuser(current_user)
    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    data = payload.model_dump(exclude_unset=True)
    if "plan" in data and data["plan"] not in PLANS:
        raise HTTPException(status_code=400, detail=f"Plan must be one of {PLANS}")
    for k, v in data.items():
        setattr(org, k, v)
    await db.flush()
    await db.refresh(org)
    return org


@router.post("/{org_id}/act-as", response_model=OrgOut)
async def act_as_tenant(org_id: int, db: DbSession, current_user: CurrentUser):
    """Platform super-admin: attach session to a tenant (sets user.organization_id).

    Staff tools still work; data isolation by org_id is phased in later.
    """
    _require_superuser(current_user)
    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not org.is_active:
        raise HTTPException(status_code=400, detail="Tenant is inactive")

    current_user.organization_id = org.id
    await db.flush()
    return org
