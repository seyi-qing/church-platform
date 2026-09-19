from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, LeaderUser
from app.models.media import MediaItem, Series
from app.schemas.media import MediaCreate, MediaOut, SeriesCreate, SeriesOut

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/series", response_model=SeriesOut, status_code=status.HTTP_201_CREATED)
async def create_series(payload: SeriesCreate, db: DbSession, _: LeaderUser):
    series = Series(**payload.model_dump())
    db.add(series)
    await db.flush()
    await db.refresh(series)
    return series


@router.get("/series", response_model=list[SeriesOut])
async def list_series(db: DbSession):
    result = await db.execute(select(Series).order_by(Series.created_at.desc()))
    return result.scalars().all()


@router.post("/items", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def create_media_item(payload: MediaCreate, db: DbSession, _: LeaderUser):
    data = payload.model_dump()
    if data.get("is_published"):
        data["published_at"] = datetime.utcnow()
    item = MediaItem(**data)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.get("/items", response_model=list[MediaOut])
async def list_media_items(
    db: DbSession,
    media_type: str | None = None,
    series_id: int | None = None,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 20,
):
    query = select(MediaItem)
    if published_only:
        query = query.where(MediaItem.is_published == True)  # noqa: E712
    if media_type:
        query = query.where(MediaItem.media_type == media_type)
    if series_id:
        query = query.where(MediaItem.series_id == series_id)
    result = await db.execute(
        query.order_by(MediaItem.published_at.desc().nullslast()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/items/{item_id}", response_model=MediaOut)
async def get_media_item(item_id: int, db: DbSession):
    result = await db.execute(select(MediaItem).where(MediaItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    item.view_count += 1
    await db.flush()
    return item


@router.patch("/items/{item_id}/publish", response_model=MediaOut)
async def publish_media_item(item_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(select(MediaItem).where(MediaItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    item.is_published = True
    item.published_at = datetime.utcnow()
    await db.flush()
    await db.refresh(item)
    return item
