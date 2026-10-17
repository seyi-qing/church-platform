from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base

import app.models  # noqa: F401

settings = get_settings()


async def _ensure_columns() -> None:
    """create_all does not ADD columns to existing tables — patch common gaps."""
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40)",
        "ALTER TABLE member_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(40)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER",
    ]
    async with engine.begin() as conn:
        for sql in statements:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                print(f"[migrate] skip {sql!r}: {e}")


async def _ensure_default_tenant() -> None:
    """Create Grace Church organization row if none exist."""
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
                    )
                )
                await db.commit()
                print("[tenant] seeded default organization: grace")
        except Exception as e:
            print(f"[tenant] seed skip: {e}")
            await db.rollback()


async def _auto_seed_if_empty() -> None:
    """Populate demo page/events/media once when the DB is empty."""
    import json
    from datetime import datetime, timedelta
    from sqlalchemy import func, select
    from app.models.cms import Page
    from app.models.event import Event
    from app.models.media import MediaItem, Series

    async with AsyncSessionLocal() as db:
        try:
            page_count = (await db.execute(select(func.count()).select_from(Page))).scalar() or 0
            if page_count == 0:
                db.add(
                    Page(
                        title="About Us",
                        slug="about",
                        is_published=True,
                        show_in_nav=True,
                        content=json.dumps(
                            {
                                "blocks": [
                                    {"type": "heading", "text": "About Grace Church"},
                                    {
                                        "type": "text",
                                        "text": "We are a community following Jesus together in worship, service, and care.",
                                    },
                                ]
                            }
                        ),
                    )
                )

            event_count = (await db.execute(select(func.count()).select_from(Event))).scalar() or 0
            if event_count == 0:
                now = datetime.utcnow()
                days_until_sunday = (6 - now.weekday()) % 7
                if days_until_sunday == 0:
                    days_until_sunday = 7
                start = now + timedelta(days=days_until_sunday)
                start = start.replace(hour=10, minute=0, second=0, microsecond=0)
                db.add(
                    Event(
                        title="Sunday Worship",
                        description="Join us for worship and the Word.",
                        location="Main Sanctuary",
                        start_at=start,
                        is_public=True,
                    )
                )

            series = (await db.execute(select(Series).limit(1))).scalar_one_or_none()
            if series is None:
                series = Series(title="Welcome Series", description="Getting started")
                db.add(series)
                await db.flush()

            media_count = (await db.execute(select(func.count()).select_from(MediaItem))).scalar() or 0
            if media_count == 0 and series is not None:
                db.add(
                    MediaItem(
                        title="What Is the Gospel?",
                        description="An introduction to the good news of Jesus.",
                        media_type="sermon",
                        series_id=series.id,
                        speaker="Pastor",
                        is_published=True,
                        published_at=datetime.utcnow(),
                    )
                )

            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"[seed] skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await _ensure_columns()
    await _ensure_default_tenant()
    await _auto_seed_if_empty()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Explicit origins + Vercel preview/production regex so CORS never blocks the web app
_cors_origins = list(settings.BACKEND_CORS_ORIGINS or [])
for extra in (
    "https://church-platform-mu.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
):
    if extra not in _cors_origins:
        _cors_origins.append(extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Always return JSON + CORS-friendly body so the browser does not show 'Failed to fetch'."""
    print(f"[error] {request.method} {request.url.path}: {exc!r}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Server error. If this persists after a redeploy, check Render logs."
        },
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.PROJECT_NAME}
