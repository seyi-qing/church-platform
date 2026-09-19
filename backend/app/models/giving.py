from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    fund: Mapped[str] = mapped_column(String(100), default="General")
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), index=True)
    stripe_charge_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="pending")
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurring_donation_id: Mapped[int | None] = mapped_column(ForeignKey("recurring_donations.id"))
    donor_email: Mapped[str | None] = mapped_column(String(255))
    donor_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="donations")
    recurring = relationship("RecurringDonation", back_populates="donations")


class RecurringDonation(Base):
    __tablename__ = "recurring_donations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    fund: Mapped[str] = mapped_column(String(100), default="General")
    interval: Mapped[str] = mapped_column(String(20), default="month")
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    next_payment_at: Mapped[datetime | None] = mapped_column(DateTime)

    donations = relationship("Donation", back_populates="recurring")
