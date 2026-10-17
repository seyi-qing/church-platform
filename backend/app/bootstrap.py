"""Startup: schema patches, default tenant, platform accounts."""

from sqlalchemy import text

from app.db.session import engine, AsyncSessionLocal


async def ensure_columns() -> None:
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40)",
        "ALTER TABLE member_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(40)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE media_items ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE series ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE livestream_sessions ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id INTEGER",
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(40) DEFAULT 'trial'",
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(120)",
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(120)",
    ]
    async with engine.begin() as conn:
        for sql in statements:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                print(f"[migrate] skip {sql!r}: {e}")


async def ensure_default_tenant() -> None:
    from sqlalchemy import select, func
    from app.models.organization import Organization

    async with AsyncSessionLocal() as db:
        try:
            count = (await db.execute(select(func.count()).select_from(Organization))).scalar() or 0
            if count == 0:
                db.add(
                    Organization(
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
                )
                await db.commit()
                print("[tenant] seeded default organization: grace")
        except Exception as e:
            print(f"[tenant] seed skip: {e}")
            await db.rollback()


async def ensure_platform_accounts() -> None:
    """Upsert platform + Grace admins. Keeps all other users."""
    from sqlalchemy import select
    from app.core.security import get_password_hash
    from app.models.organization import Organization
    from app.models.user import User
    from app.services.tenant import backfill_org_ids

    default_password = "Password123!"
    async with AsyncSessionLocal() as db:
        try:
            grace = (
                await db.execute(select(Organization).where(Organization.slug == "grace"))
            ).scalar_one_or_none()
            if not grace:
                print("[accounts] no grace org — skip")
                return

            counts = await backfill_org_ids(db, grace.id)
            print(f"[tenant] backfill: {counts}")

            specs = [
                {
                    "email": "admin@churchplatform.com",
                    "full_name": "Platform Super Admin",
                    "role": "admin",
                    "is_superuser": True,
                    "organization_id": None,
                },
                {
                    "email": "admin@gracechurch.org",
                    "full_name": "Grace Church Admin",
                    "role": "admin",
                    "is_superuser": False,
                    "organization_id": grace.id,
                },
            ]
            for s in specs:
                row = (
                    await db.execute(select(User).where(User.email == s["email"]))
                ).scalar_one_or_none()
                if row:
                    row.full_name = s["full_name"]
                    row.role = s["role"]
                    row.is_superuser = s["is_superuser"]
                    row.organization_id = s["organization_id"]
                    row.is_active = True
                    row.hashed_password = get_password_hash(default_password)
                    print(f"[accounts] updated {s['email']}")
                else:
                    db.add(
                        User(
                            email=s["email"],
                            full_name=s["full_name"],
                            role=s["role"],
                            is_superuser=s["is_superuser"],
                            organization_id=s["organization_id"],
                            is_active=True,
                            hashed_password=get_password_hash(default_password),
                        )
                    )
                    print(f"[accounts] created {s['email']}")
            await db.commit()
        except Exception as e:
            print(f"[accounts] skip: {e}")
            await db.rollback()
