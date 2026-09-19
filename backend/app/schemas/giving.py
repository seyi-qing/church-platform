from datetime import datetime
from pydantic import BaseModel, Field


class DonationCreate(BaseModel):
    amount_cents: int = Field(gt=0)
    fund: str = "General"
    is_recurring: bool = False
    donor_email: str | None = None
    donor_name: str | None = None


class DonationOut(BaseModel):
    id: int
    amount_cents: int
    currency: str
    fund: str
    status: str
    is_recurring: bool
    donor_email: str | None
    donor_name: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class DonationIntentResponse(BaseModel):
    client_secret: str
    donation_id: int


class RecurringDonationCreate(BaseModel):
    amount_cents: int = Field(gt=0)
    fund: str = "General"
    interval: str = "month"
