# app/models/member.py
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Family(Base):
    __tablename__ = "families"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members = relationship("MemberProfile", back_populates="family")


class MemberProfile(Base):
    __tablename__ = "member_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    family_id: Mapped[int | None] = mapped_column(ForeignKey("families.id"))
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(40))
    birthdate: Mapped[date | None] = mapped_column(Date)
    baptism_date: Mapped[date | None] = mapped_column(Date)
    membership_status: Mapped[str] = mapped_column(String(50), default="active")
    notes: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="member_profile")
    family = relationship("Family", back_populates="members")
    group_memberships = relationship("GroupMembership", back_populates="member")


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    group_type: Mapped[str] = mapped_column(String(50), default="small_group")
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    meeting_day: Mapped[str | None] = mapped_column(String(50))
    meeting_time: Mapped[str | None] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(255))
    leader_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    memberships = relationship("GroupMembership", back_populates="group")


class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("member_profiles.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="memberships")
    member = relationship("MemberProfile", back_populates="group_memberships")


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))
    member_id: Mapped[int] = mapped_column(ForeignKey("member_profiles.id"), nullable=False)
    checked_in_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    checked_in_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    notes: Mapped[str | None] = mapped_column(String(255))
