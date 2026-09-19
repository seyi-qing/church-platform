import stripe
from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, AdminUser
from app.core.config import get_settings
from app.models.giving import Donation, RecurringDonation
from app.schemas.giving import (
    DonationCreate,
    DonationIntentResponse,
    DonationOut,
    RecurringDonationCreate,
)

router = APIRouter(prefix="/giving", tags=["giving"])
settings = get_settings()
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/intent", response_model=DonationIntentResponse)
async def create_donation_intent(
    payload: DonationCreate,
    db: DbSession,
    current_user: CurrentUser | None = None,
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    try:
        intent = stripe.PaymentIntent.create(
            amount=payload.amount_cents,
            currency="usd",
            metadata={"fund": payload.fund, "user_id": str(current_user.id) if current_user else ""},
            automatic_payment_methods={"enabled": True},
            receipt_email=payload.donor_email or (current_user.email if current_user else None),
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    donation = Donation(
        user_id=current_user.id if current_user else None,
        amount_cents=payload.amount_cents,
        fund=payload.fund,
        stripe_payment_intent_id=intent.id,
        status="pending",
        is_recurring=payload.is_recurring,
        donor_email=payload.donor_email or (current_user.email if current_user else None),
        donor_name=payload.donor_name or (current_user.full_name if current_user else None),
    )
    db.add(donation)
    await db.flush()
    await db.refresh(donation)
    return DonationIntentResponse(client_secret=intent.client_secret, donation_id=donation.id)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: DbSession):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        result = await db.execute(select(Donation).where(Donation.stripe_payment_intent_id == pi["id"]))
        donation = result.scalar_one_or_none()
        if donation:
            donation.status = "succeeded"
            await db.flush()
    elif event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("mode") == "subscription":
            meta = session.get("metadata") or {}
            sub_id = session.get("subscription")
            user_id = meta.get("user_id")
            if user_id and sub_id:
                result = await db.execute(
                    select(RecurringDonation)
                    .where(RecurringDonation.user_id == int(user_id))
                    .where(RecurringDonation.status == "pending")
                    .order_by(RecurringDonation.created_at.desc())
                    .limit(1)
                )
                rec = result.scalar_one_or_none()
                if rec:
                    rec.stripe_subscription_id = sub_id
                    rec.status = "active"
                    await db.flush()
    return {"received": True}


@router.get("/history", response_model=list[DonationOut])
async def donation_history(db: DbSession, _: AdminUser, limit: int = 50):
    result = await db.execute(select(Donation).order_by(Donation.created_at.desc()).limit(limit))
    return result.scalars().all()


@router.post("/recurring/checkout")
async def create_recurring_checkout(payload: RecurringDonationCreate, db: DbSession, current_user: CurrentUser):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    interval = payload.interval if payload.interval in ("week", "month", "year") else "month"
    try:
        price = stripe.Price.create(
            unit_amount=payload.amount_cents,
            currency="usd",
            recurring={"interval": interval},
            product_data={"name": f"Recurring gift – {payload.fund}"},
        )
        origin = settings.BACKEND_CORS_ORIGINS[0] if settings.BACKEND_CORS_ORIGINS else "http://localhost:3000"
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price.id, "quantity": 1}],
            success_url=origin + "/give?recurring=success&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=origin + "/give?recurring=cancel",
            customer_email=current_user.email,
            metadata={"user_id": str(current_user.id), "fund": payload.fund},
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    rec = RecurringDonation(
        user_id=current_user.id,
        amount_cents=payload.amount_cents,
        fund=payload.fund,
        interval=interval,
        status="pending",
    )
    db.add(rec)
    await db.flush()
    return {"url": session.url, "recurring_id": rec.id}


@router.get("/recurring/mine")
async def my_recurring(db: DbSession, current_user: CurrentUser):
    result = await db.execute(
        select(RecurringDonation).where(RecurringDonation.user_id == current_user.id)
    )
    return [
        {
            "id": r.id,
            "amount_cents": r.amount_cents,
            "fund": r.fund,
            "interval": r.interval,
            "status": r.status,
        }
        for r in result.scalars().all()
    ]
