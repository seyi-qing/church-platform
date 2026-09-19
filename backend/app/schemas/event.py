from datetime import datetime
from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    is_all_day: bool = False
    is_public: bool = True
    requires_registration: bool = False
    max_attendees: int | None = None
    cover_image_url: str | None = None


class EventOut(EventCreate):
    id: int
    created_by: int | None
    created_at: datetime
    model_config = {"from_attributes": True}


class EventRegistrationCreate(BaseModel):
    event_id: int
    notes: str | None = None
