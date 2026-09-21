from datetime import datetime
from pydantic import BaseModel, Field


class DeviceRegister(BaseModel):
    token: str = Field(min_length=10, max_length=512)
    platform: str = "unknown"
    device_name: str | None = None


class DeviceOut(BaseModel):
    id: int
    token: str
    platform: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class SendNotificationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1, max_length=2000)
    target: str = "all"
    target_value: str | None = None
    data: dict | None = None
    channel: str = "push"  # push | email | sms


class NotificationLogOut(BaseModel):
    id: int
    title: str
    body: str
    target: str
    sent_count: int
    failed_count: int
    created_at: datetime
    model_config = {"from_attributes": True}


class SendNotificationResponse(BaseModel):
    sent: int
    failed: int
    log_id: int
    errors: list[str] = []
    channel: str = "push"
    configured: bool = True
