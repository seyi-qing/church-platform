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
from app.bootstrap import ensure_columns, ensure_default_tenant, ensure_platform_accounts
from app.services.tenant import set_request_tenant_slug

settings = get_settings()


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
                db.add(
                    Event(
                        title="Sunday Worship",
                        description="Join us for worship and the Word.",
                        location="Main Auditorium",
                        start_at=now + timedelta(days=(6 - now.weekday()) % 7 or 7),
                        end_at=None,
                        is_published=True,
                    )
                )

            media_count = (await db.execute(select(func.count()).select_from(MediaItem))).scalar() or 0
            if media_count == 0:
                series = Series(title="Foundations", description="Core teachings", is_published=True)
                db.add(series)
                await db.flush()
                db.add(
                    MediaItem(
                        title="Welcome to Grace",
                        description="An introduction to our community.",
                        speaker="Pastor",
                        media_type="video",
                        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        is_published=True,
                        series_id=series.id,
                    )
                )

            await db.commit()
        except Exception as e:
            print(f"[seed] skip: {e}")
            await db.rollback()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_columns()
    await ensure_default_tenant()
    await ensure_platform_accounts()
    await _auto_seed_if_empty()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def tenant_slug_middleware(request: Request, call_next):
    """Public multi-tenant: X-Tenant-Slug header or ?tenant=slug (from subdomain/path on web)."""
    slug = request.headers.get("X-Tenant-Slug") or request.query_params.get("tenant")
    set_request_tenant_slug(slug)
    try:
        response = await call_next(request)
    finally:
        set_request_tenant_slug(None)
    return response


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})
