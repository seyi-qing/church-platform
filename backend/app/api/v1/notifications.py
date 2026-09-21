import json
from datetime import datetime

from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession, LeaderUser
from app.models.notification import NotificationLog, PushDevice
from app.models.user import User
from app.schemas.notification import (
    DeviceOut,
    DeviceRegister,
    NotificationLogOut,
    SendNotificationRequest,
    SendNotificationResponse,
)
from app.services import push as push_service
from app.services import email_sms

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/vapid-public-key")
async def vapid_public_key():
    key = push_service.get_vapid_public_key()
    if not key:
        return {"publicKey": None, "configured": False}
    return {"publicKey": key, "configured": True}


@router.get("/channels")
async def channel_status():
    return {
        "push": bool(push_service.get_vapid_public_key()),
        "email": email_sms.email_configured(),
        "sms": email_sms.sms_configured(),
    }


@router.post("/devices", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def register_device(payload: DeviceRegister, db: DbSession):
    result = await db.execute(select(PushDevice).where(PushDevice.token == payload.token))
    device = result.scalar_one_or_none()
    if device:
        device.is_active = True
        device.platform = payload.platform
        device.device_name = payload.device_name
        device.last_used_at = datetime.utcnow()
    else:
        device = PushDevice(
            token=payload.token,
            platform=payload.platform,
            device_name=payload.device_name,
            user_id=None,
            is_active=True,
            last_used_at=datetime.utcnow(),
        )
        db.add(device)
    await db.flush()
    await db.refresh(device)
    return device


@router.delete("/devices")
async def unregister_device(payload: DeviceRegister, db: DbSession):
    result = await db.execute(select(PushDevice).where(PushDevice.token == payload.token))
    device = result.scalar_one_or_none()
    if device:
        device.is_active = False
        await db.flush()
    return {"ok": True}


@router.post("/send", response_model=SendNotificationResponse)
async def send_notification(
    payload: SendNotificationRequest, db: DbSession, current_user: LeaderUser
):
    channel = (payload.channel or "push").lower()
    errors: list[str] = []
    sent = failed = 0
    configured = True

    if channel == "email":
        users_q = await db.execute(
            select(User.email).where(
                User.is_active == True, User.email.isnot(None)  # noqa: E712
            )
        )
        emails = [r[0] for r in users_q.all() if r[0]]
        if payload.target == "role" and payload.target_value:
            users_q = await db.execute(
                select(User.email).where(
                    User.role == payload.target_value,
                    User.is_active == True,  # noqa: E712
                )
            )
            emails = [r[0] for r in users_q.all() if r[0]]
        result = await email_sms.send_email_batch(emails, payload.title, payload.body)
        sent, failed = result["sent"], result["failed"]
        errors = result.get("errors") or []
        configured = bool(result.get("configured"))
    elif channel == "sms":
        # Prefer member profile phones when present; fall back to empty
        from app.models.member import MemberProfile

        phones_q = await db.execute(
            select(MemberProfile.phone).where(MemberProfile.phone.isnot(None))
        )
        phones = [r[0] for r in phones_q.all() if r[0]]
        result = await email_sms.send_sms_batch(phones, f"{payload.title}\n{payload.body}")
        sent, failed = result["sent"], result["failed"]
        errors = result.get("errors") or []
        configured = bool(result.get("configured"))
    else:
        query = select(PushDevice).where(PushDevice.is_active == True)  # noqa: E712
        if payload.target == "user" and payload.target_value:
            query = query.where(PushDevice.user_id == int(payload.target_value))
        elif payload.target == "role" and payload.target_value:
            user_ids_q = await db.execute(
                select(User.id).where(
                    User.role == payload.target_value, User.is_active == True  # noqa: E712
                )
            )
            user_ids = [r[0] for r in user_ids_q.all()]
            if not user_ids:
                return SendNotificationResponse(
                    sent=0,
                    failed=0,
                    log_id=0,
                    errors=["No users with that role"],
                    channel=channel,
                )
            query = query.where(PushDevice.user_id.in_(user_ids))
        result = await db.execute(query)
        tokens = [d.token for d in result.scalars().all()]
        send_result = await push_service.notify_devices(
            tokens, payload.title, payload.body, payload.data
        )
        sent = send_result["sent"]
        failed = send_result["failed"]
        errors = send_result.get("errors") or []
        configured = bool(push_service.get_vapid_public_key())
        for gone in send_result.get("gone_tokens") or []:
            gone_q = await db.execute(select(PushDevice).where(PushDevice.token == gone))
            gone_dev = gone_q.scalar_one_or_none()
            if gone_dev:
                gone_dev.is_active = False

    log = NotificationLog(
        title=f"[{channel}] {payload.title}" if channel != "push" else payload.title,
        body=payload.body,
        data_json=json.dumps({"channel": channel, **(payload.data or {})}),
        target=payload.target,
        target_id=payload.target_value,
        sent_count=sent,
        failed_count=failed,
        created_by=current_user.id,
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return SendNotificationResponse(
        sent=sent,
        failed=failed,
        log_id=log.id,
        errors=errors,
        channel=channel,
        configured=configured,
    )


@router.get("/logs", response_model=list[NotificationLogOut])
async def list_logs(db: DbSession, _: AdminUser, limit: int = 30):
    result = await db.execute(
        select(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(limit)
    )
    return result.scalars().all()
