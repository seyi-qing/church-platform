from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base

import app.models  # noqa: F401

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
                days_until_sunday = (6 - now.weekday()) % 7 or 7
                db.add(
                    Event(
                        title="Sunday Worship",
                        description="Join us for worship, teaching, and fellowship.",
                        location="Main Sanctuary",
                        start_at=now + timedelta(days=days_until_sunday),
                        is_public=True,
                    )
                )
                db.add(
                    Event(
                        title="Midweek Prayer",
                        description="A quiet hour of prayer for our church and city.",
                        location="Chapel",
                        start_at=now + timedelta(days=3),
                        is_public=True,
                    )
                )

            series_count = (await db.execute(select(func.count()).select_from(Series))).scalar() or 0
            series = None
            if series_count == 0:
                series = Series(
                    title="Foundations of Faith",
                    description="Core teachings for everyday discipleship.",
                    is_published=True,
                )
                db.add(series)
                await db.flush()
            else:
                series = (await db.execute(select(Series).limit(1))).scalar_one_or_none()

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
    # Create tables + seed empty DB in any environment (suitable for free-tier testing).
    # For a hardened production later, switch to Alembic-only and disable auto-seed.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.PROJECT_NAME}
