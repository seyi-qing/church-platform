from datetime import datetime
from pydantic import BaseModel


class MediaCreate(BaseModel):
    title: str
    description: str | None = None
    media_type: str = "sermon"
    speaker: str | None = None
    series_id: int | None = None
    audio_url: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    duration_seconds: int | None = None
    is_published: bool = False


class MediaOut(MediaCreate):
    id: int
    view_count: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}


class SeriesCreate(BaseModel):
    title: str
    description: str | None = None
    cover_image_url: str | None = None


class SeriesOut(SeriesCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
