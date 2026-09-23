from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContactInquiry(Base):
    """Public Contact Us / inquiry submissions for staff inbox."""

    __tablename__ = "contact_inquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    topic: Mapped[str] = mapped_column(String(80), default="general")  # general, visit, prayer, give, other
    subject: Mapped[str] = mapped_column(String(255), default="")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="new", index=True)  # new, in_progress, resolved, spam
    staff_notes: Mapped[str | None] = mapped_column(Text)
    assigned_to: Mapped[int | None] = mapped_column(Integer)
    follow_up_created: Mapped[bool] = mapped_column(Boolean, default=False)
    care_request_id: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
