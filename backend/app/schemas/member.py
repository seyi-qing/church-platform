from datetime import date, datetime
from pydantic import BaseModel


class MemberProfileCreate(BaseModel):
    user_id: int
    family_id: int | None = None
    address: str | None = None
    birthdate: date | None = None
    baptism_date: date | None = None
    membership_status: str = "active"
    notes: str | None = None
    photo_url: str | None = None


class MemberProfileOut(MemberProfileCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class FamilyCreate(BaseModel):
    name: str
    address: str | None = None


class FamilyOut(FamilyCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class GroupCreate(BaseModel):
    name: str
    description: str | None = None
    group_type: str = "small_group"
    is_public: bool = True
    meeting_day: str | None = None
    meeting_time: str | None = None
    location: str | None = None


class GroupOut(GroupCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class GroupMembershipCreate(BaseModel):
    group_id: int
    member_id: int
    role: str = "member"


class AttendanceCreate(BaseModel):
    event_id: int | None = None
    member_id: int
    notes: str | None = None
