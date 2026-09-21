from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import select

from app.api.deps import DbSession, LeaderUser
from app.models.gallery import GalleryPhoto

router = APIRouter(prefix="/gallery", tags=["gallery"])


class PhotoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    caption: str | None = None
    image_url: str = Field(min_length=8, max_length=1000)
    album: str = "General"
    sort_order: int = 0
    is_published: bool = True


class PhotoUpdate(BaseModel):
    title: str | None = None
    caption: str | None = None
    image_url: str | None = None
    album: str | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class PhotoOut(BaseModel):
    id: int
    title: str
    caption: str | None
    image_url: str
    album: str
    sort_order: int
    is_published: bool
    created_at: datetime
    model_config = {"from_attributes": True}


@router.get("/photos", response_model=list[PhotoOut])
async def list_photos(
    db: DbSession,
    published_only: bool = True,
    album: str | None = None,
    limit: int = 100,
):
    q = select(GalleryPhoto).order_by(
        GalleryPhoto.sort_order.asc(), GalleryPhoto.created_at.desc()
    )
    if published_only:
        q = q.where(GalleryPhoto.is_published == True)  # noqa: E712
    if album:
        q = q.where(GalleryPhoto.album == album)
    result = await db.execute(q.limit(limit))
    return result.scalars().all()


@router.get("/albums")
async def list_albums(db: DbSession, published_only: bool = True):
    q = select(GalleryPhoto.album).distinct().order_by(GalleryPhoto.album)
    if published_only:
        q = q.where(GalleryPhoto.is_published == True)  # noqa: E712
    result = await db.execute(q)
    return [r[0] for r in result.all() if r[0]]


@router.post("/photos", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def create_photo(payload: PhotoCreate, db: DbSession, _: LeaderUser):
    url = payload.image_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="image_url must be an http(s) link")
    photo = GalleryPhoto(
        title=payload.title.strip(),
        caption=payload.caption,
        image_url=url,
        album=(payload.album or "General").strip() or "General",
        sort_order=payload.sort_order,
        is_published=payload.is_published,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)
    return photo


@router.patch("/photos/{photo_id}", response_model=PhotoOut)
async def update_photo(
    photo_id: int, payload: PhotoUpdate, db: DbSession, _: LeaderUser
):
    result = await db.execute(select(GalleryPhoto).where(GalleryPhoto.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    data = payload.model_dump(exclude_unset=True)
    if "image_url" in data and data["image_url"]:
        url = data["image_url"].strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            raise HTTPException(status_code=400, detail="image_url must be an http(s) link")
        data["image_url"] = url
    for k, v in data.items():
        setattr(photo, k, v)
    await db.flush()
    await db.refresh(photo)
    return photo


@router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: int, db: DbSession, _: LeaderUser):
    result = await db.execute(select(GalleryPhoto).where(GalleryPhoto.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    await db.delete(photo)
    await db.flush()
    return {"ok": True}
