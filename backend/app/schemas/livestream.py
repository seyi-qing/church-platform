from datetime import datetime
from pydantic import BaseModel


class LivestreamCreate(BaseModel):
    title: str
    description: str | None = None
    scheduled_start: datetime | None = None
    youtube_url: str | None = None
    is_public: bool = True


class LivestreamOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    mux_playback_id: str | None
    playback_url: str | None
    youtube_url: str | None
    scheduled_start: datetime | None
    actual_start: datetime | None
    is_public: bool
    created_at: datetime
    model_config = {"from_attributes": True}
