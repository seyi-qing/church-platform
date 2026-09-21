from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from sqlalchemy import select

from app.api.deps import LeaderUser, DbSession
from app.models.media import MediaItem, Series
from app.schemas.media import (
    MediaItemCreate,
    MediaItemOut,
    MediaItemUpdate,
    SeriesCreate,
    SeriesOut,
)

router = APIRouter(prefix="/media", tags=["media"])


def _require_playable(
    media_type: str,
    video_url: str | None,
    audio_url: str | None,
    description: str | None,
    *,
    publishing: bool,
) -> None:
    """When publishing, ensure the item can actually be consumed on /sermons."""
    if not publishing:
        return
    mt = (media_type or "sermon").lower()
    video = (video_url or "").strip()
    audio = (audio_url or "").strip()
    text = (description or "").strip()

    if mt == "video" and not video:
        raise HTTPException(
            status_code=400,
            detail="Published video needs a Video URL (YouTube or public file link).",
        )
    if mt in ("audio", "podcast") and not audio:
        raise HTTPException(
            status_code=400,
            detail="Published audio/podcast needs an Audio URL.",
        )
    if mt == "text" and not text:
        raise HTTPException(
            status_code=400,
            detail="Published text message needs a description/body.",
        )
    if mt == "sermon" and not video and not audio and not text:
        raise HTTPException(
            status_code=400,
            detail="Published sermon needs a video URL, audio URL, or text description.",
        )


@router.post("/series", response_model=SeriesOut, status_code=status.HTTP_201_CREATED)
async def create_series(payload: SeriesCreate, db: DbSession, _: LeaderUser):
    series = Series(**payload.model_dump())
    db.add(series)
    await db.flush()
    await db.refresh(series)
    return series


@router.get("/series", response_model=list[SeriesOut])
async def list_series(db: DbSession, published_only: bool = True):
    query = select(Series)
    if published_only:
        query = query.where(Series.is_published == True)  # noqa: E712
    result = await db.execute(query.order_by(Series.created_at.desc()))
    return result.scalars().all()


@router.post("/items", response_model=MediaItemOut, status_code=status.HTTP_201_CREATED)
async def create_media_item(payload: MediaItemCreate, db: DbSession, _: LeaderUser):
    data = payload.model_dump()
    _require_playable(
        data.get("media_type") or "sermon",
        data.get("video_url"),
        data.get("audio_url"),
        data.get("description"),
        publishing=bool(data.get("is_published")),
    )
    if data.get("is_published"):
        data["published_at"] = datetime.utcnow()
    item = MediaItem(**data)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.get("/items", response_model=list[MediaItemOut])
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
        query.order_by(MediaItem.id.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/items/{item_id}", response_model=MediaItemOut)
async def get_media_item(item_id: int, db: DbSession):
    result = await db.execute(select(MediaItem).where(MediaItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    return item


@router.patch("/items/{item_id}", response_model=MediaItemOut)
async def update_media_item(
    item_id: int, payload: MediaItemUpdate, db: DbSession, _: LeaderUser
):
    result = await db.execute(select(MediaItem).where(MediaItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(item, k, v)

    will_publish = item.is_published if "is_published" not in data else bool(data["is_published"])
    _require_playable(
        item.media_type,
        item.video_url,
        item.audio_url,
        item.description,
        publishing=will_publish,
    )

    if data.get("is_published") is True and not item.published_at:
        item.published_at = datetime.utcnow()
    await db.flush()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}")
async def delete_media_item(item_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(select(MediaItem).where(MediaItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    await db.delete(item)
    await db.flush()
    return {"ok": True}


@router.patch("/items/{item_id}/publish", response_model=MediaItemOut)
async def publish_media_item(item_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(select(MediaItem).where(MediaItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
    _require_playable(
        item.media_type,
        item.video_url,
        item.audio_url,
        item.description,
        publishing=True,
    )
    item.is_published = True
    item.published_at = datetime.utcnow()
    await db.flush()
    await db.refresh(item)
    return item


@router.post("/upload")
async def upload_media_file(
    _: LeaderUser,
    file: UploadFile = File(...),
):
    from app.services import storage as storage_service

    if not storage_service.storage_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "File storage not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, "
                "S3_SECRET_KEY, S3_BUCKET (Cloudflare R2 works). "
                "Or paste a YouTube/public file URL when creating media."
            ),
        )
    raw = await file.read()
    if len(raw) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 200MB)")
    try:
        result = storage_service.upload_bytes(
            raw,
            file.filename or "upload.bin",
            file.content_type or "application/octet-stream",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return result
