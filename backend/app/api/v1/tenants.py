"""Tenant / organization API — multi-tenant foundation + platform super-admin."""

import re
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OptionalUser
from app.models.organization import Organization

router = APIRouter(prefix="/tenants", tags=["tenants"])

PLANS = ("starter", "growth", "pro")


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return s or "church"


class OrgOut(BaseModel):
    id: int
    name: str
    slug: str
    tagline: str | None = None
    primary_color: str | None = None
    timezone: str | None = None
    service_times: str | None = None
    address: str | None = None
    plan: str = "starter"
    is_active: bool = True
    subscription_status: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class OrgCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    slug: str | None = None
    tagline: str | None = None
    primary_color: str | None = "#1d4ed8"
    timezone: str | None = "Africa/Kampala"
    service_times: str | None = None
    address: str | None = None
    plan: str = "starter"


class OrgUpdate(BaseModel):
    name: str | None = None
    tagline: str | None = None
    primary_color: str | None = None
    timezone: str | None = None
    service_times: str | None = None
    address: str | None = None
    plan: str | None = None
    is_active: bool | None = None


def _require_superuser(user) -> None:
    if not getattr(user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Platform super-admin only")


async def ensure_default_org(db) -> Organization:
    row = (
        await db.execute(select(Organization).where(Organization.slug == "grace"))
    ).scalar_one_or_none()
    if row:
        return row
    any_org = (await db.execute(select(Organization).limit(1))).scalar_one_or_none()
    if any_org:
        return any_org
    org = Organization(
        name="Grace Church",
        slug="grace",
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


@router.get("/current", response_model=OrgOut)
async def current_tenant(db: DbSession, user: OptionalUser = None):
    """Active tenant: Act-as / staff org, else X-Tenant-Slug, else Grace."""
    if user is not None and user.organization_id is not None:
        org = (
            await db.execute(
                select(Organization).where(Organization.id == user.organization_id)
            )
        ).scalar_one_or_none()
        if org:
            return org
    from app.services.tenant import get_request_tenant_slug, get_org_by_slug

    slug = get_request_tenant_slug()
    if slug:
        org = await get_org_by_slug(db, slug)
        if org and org.is_active:
            return org
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
        subscription_status="trial",
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


@router.patch("/current", response_model=OrgOut)
async def update_current_tenant(payload: OrgUpdate, db: DbSession, current_user: AdminUser):
    """Church admin (or Act-as) updates branding of the active organization."""
    if current_user.organization_id:
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
    if "plan" in data and data["plan"] not in PLANS:
        raise HTTPException(status_code=400, detail=f"Plan must be one of {PLANS}")
    if "is_active" in data and not current_user.is_superuser:
        data.pop("is_active", None)
    if "plan" in data and not current_user.is_superuser:
        data.pop("plan", None)

    for k, v in data.items():
        setattr(org, k, v)
    await db.flush()
    await db.refresh(org)
    return org


@router.get("/by-slug/{slug}", response_model=OrgOut)
async def tenant_by_slug(slug: str, db: DbSession):
    """Public: resolve church by subdomain/path slug for branding + isolation."""
    from app.services.tenant import get_org_by_slug

    org = await get_org_by_slug(db, slug)
    if not org or not org.is_active:
        raise HTTPException(status_code=404, detail="Church not found")
    return org


@router.post("/{org_id}/billing/checkout")
async def tenant_billing_checkout(
    org_id: int, db: DbSession, current_user: CurrentUser, plan: str = "growth"
):
    """Platform super-admin: start Stripe Checkout for a tenant plan (or demo mode)."""
    _require_superuser(current_user)
    from app.core.config import get_settings

    settings = get_settings()
    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if plan not in PLANS:
        plan = "growth"

    if not getattr(settings, "STRIPE_SECRET_KEY", None):
        org.plan = plan
        org.subscription_status = "active"
        org.stripe_subscription_id = f"demo_sub_{org.id}"
        await db.flush()
        await db.refresh(org)
        return {
            "demo": True,
            "url": None,
            "message": f"{org.name} set to plan={plan} (demo — set STRIPE_SECRET_KEY for live billing).",
            "organization": {
                "id": org.id,
                "name": org.name,
                "plan": org.plan,
                "subscription_status": org.subscription_status,
            },
        }

    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    price_map = {
        "starter": getattr(settings, "STRIPE_PRICE_STARTER", None),
        "growth": getattr(settings, "STRIPE_PRICE_GROWTH", None),
        "pro": getattr(settings, "STRIPE_PRICE_PRO", None),
    }
    try:
        if not org.stripe_customer_id:
            customer = stripe.Customer.create(
                name=org.name,
                metadata={"organization_id": str(org.id), "slug": org.slug},
            )
            org.stripe_customer_id = customer.id
            await db.flush()

        price_id = price_map.get(plan)
        if price_id:
            line_items = [{"price": price_id, "quantity": 1}]
        else:
            amounts = {"starter": 2900, "growth": 7900, "pro": 14900}
            price = stripe.Price.create(
                unit_amount=amounts.get(plan, 7900),
                currency="usd",
                recurring={"interval": "month"},
                product_data={"name": f"Church Platform — {plan.title()}"},
            )
            line_items = [{"price": price.id, "quantity": 1}]

        origins = settings.BACKEND_CORS_ORIGINS or ["http://localhost:3000"]
        origin = next((o for o in origins if "vercel" in o), origins[0])
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=org.stripe_customer_id,
            line_items=line_items,
            success_url=origin.rstrip("/") + "/platform?billing=success",
            cancel_url=origin.rstrip("/") + "/platform?billing=cancel",
            metadata={"organization_id": str(org.id), "plan": plan},
        )
        org.plan = plan
        org.subscription_status = "checkout"
        await db.flush()
        return {"demo": False, "url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


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
    """Platform super-admin: attach session to a tenant (sets user.organization_id)."""
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
    await db.refresh(current_user)
    return org


@router.post("/clear-act-as")
async def clear_act_as(db: DbSession, current_user: CurrentUser):
    """Platform super-admin: leave church context (organization_id = null)."""
    _require_superuser(current_user)
    current_user.organization_id = None
    await db.flush()
    return {"ok": True, "organization_id": None}
