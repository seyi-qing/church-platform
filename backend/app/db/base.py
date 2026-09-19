# app/db/base.py
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# EXPLICITLY IMPORT ALL MODELS HERE SO SQLALCHEMY REGISTERS THEM Together:
from app.models.user import User  # Adjust path to match your structure
from app.models.member import Family, MemberProfile, Group, GroupMembership, Attendance
# Import your Donation and Event models here too!
