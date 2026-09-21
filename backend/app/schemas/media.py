from datetime import datetime
from pydantic import BaseModel


class SeriesCreate(BaseModel):
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    is_published: bool = False


class SeriesOut(SeriesCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class MediaItemCreate(BaseModel):
    title: str
    description: str | None = None
    media_type: str = "sermon"
    series_id: int | None = None
    speaker: str | None = None
    scripture: str | None = None
    duration_seconds: int | None = None
    video_url: str | None = None
    audio_url: str | None = None
    thumbnail_url: str | None = None
    transcript: str | None = None
    is_published: bool = False


class MediaItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    media_type: str | None = None
    speaker: str | None = None
    scripture: str | None = None
    video_url: str | None = None
    audio_url: str | None = None
    thumbnail_url: str | None = None
    is_published: bool | None = None


class MediaItemOut(MediaItemCreate):
    id: int
    published_at: datetime | None = None
    view_count: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}
