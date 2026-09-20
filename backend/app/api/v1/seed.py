"""One-shot demo content for empty installs."""
from datetime import datetime, timedelta
import json

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import AdminUser, DbSession
from app.models.cms import Page
from app.models.event import Event
from app.models.media import MediaItem, Series

router = APIRouter(prefix="/seed", tags=["seed"])


@router.post("/demo")
async def seed_demo(db: DbSession, _: AdminUser):
    """Create 1 page, 2 events, 1 sermon series + item if missing."""
    created = {"pages": 0, "events": 0, "series": 0, "media": 0}

    page_count = (await db.execute(select(func.count()).select_from(Page))).scalar() or 0
    if page_count == 0:
        page = Page(
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
        db.add(page)
        created["pages"] = 1

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
        created["events"] = 2

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
        created["series"] = 1
    else:
        series = (await db.execute(select(Series).limit(1))).scalar_one_or_none()

    media_count = (await db.execute(select(func.count()).select_from(MediaItem))).scalar() or 0
    if media_count == 0 and series:
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
        created["media"] = 1

    await db.flush()
    return {"ok": True, "created": created, "message": "Demo content ready"}
