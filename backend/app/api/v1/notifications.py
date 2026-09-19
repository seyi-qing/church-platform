import json
from datetime import datetime

from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import AdminUser, OptionalUser, DbSession, LeaderUser
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

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/vapid-public-key")
async def vapid_public_key():
    key = push_service.get_vapid_public_key()
    if not key:
        return {"publicKey": None, "configured": False}
    return {"publicKey": key, "configured": True}


@router.post("/devices", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceRegister,
    db: DbSession,
    current_user: OptionalUser,
):
    result = await db.execute(select(PushDevice).where(PushDevice.token == payload.token))
    device = result.scalar_one_or_none()
    if device:
        device.is_active = True
        device.platform = payload.platform
        device.device_name = payload.device_name
        device.last_used_at = datetime.utcnow()
        if current_user:
            device.user_id = current_user.id
    else:
        device = PushDevice(
            token=payload.token,
            platform=payload.platform,
            device_name=payload.device_name,
            user_id=current_user.id if current_user else None,
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
                sent=0, failed=0, log_id=0, errors=["No users with that role"]
            )
        query = query.where(PushDevice.user_id.in_(user_ids))
    result = await db.execute(query)
    tokens = [d.token for d in result.scalars().all()]
    send_result = await push_service.notify_devices(
        tokens, payload.title, payload.body, payload.data
    )
    for gone in send_result.get("gone_tokens") or []:
        gone_q = await db.execute(select(PushDevice).where(PushDevice.token == gone))
        gone_dev = gone_q.scalar_one_or_none()
        if gone_dev:
            gone_dev.is_active = False
    log = NotificationLog(
        title=payload.title,
        body=payload.body,
        data_json=json.dumps(payload.data) if payload.data else None,
        target=payload.target,
        target_id=payload.target_value,
        sent_count=send_result["sent"],
        failed_count=send_result["failed"],
        created_by=current_user.id,
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return SendNotificationResponse(
        sent=send_result["sent"],
        failed=send_result["failed"],
        log_id=log.id,
        errors=send_result.get("errors") or [],
    )


@router.get("/logs", response_model=list[NotificationLogOut])
async def list_logs(db: DbSession, _: AdminUser, limit: int = 30):
    result = await db.execute(
        select(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(limit)
    )
    return result.scalars().all()
