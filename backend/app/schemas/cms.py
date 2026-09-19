from datetime import datetime
from pydantic import BaseModel


class PageCreate(BaseModel):
    slug: str
    title: str
    content: str | None = None
    meta_description: str | None = None
    is_published: bool = False
    show_in_nav: bool = False
    nav_order: int = 0


class PageUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    meta_description: str | None = None
    is_published: bool | None = None
    show_in_nav: bool | None = None
    nav_order: int | None = None


class PageOut(PageCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
