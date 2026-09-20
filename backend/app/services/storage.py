"""Optional S3-compatible storage (AWS S3, MinIO, Cloudflare R2)."""
from __future__ import annotations

import uuid
from typing import Any

from app.core.config import get_settings

settings = get_settings()


def storage_configured() -> bool:
    endpoint = (settings.S3_ENDPOINT or "").strip()
    key = (settings.S3_ACCESS_KEY or "").strip()
    secret = (settings.S3_SECRET_KEY or "").strip()
    bucket = (settings.S3_BUCKET or "").strip()
    if not (endpoint and key and secret and bucket):
        return False
    # Docker-compose defaults are not reachable on Render/Vercel
    if "minio:9000" in endpoint or endpoint.startswith("http://minio"):
        return False
    return True


def _client():
    import boto3
    from botocore.client import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION or "auto",
        config=Config(signature_version="s3v4"),
    )


def public_url_for_key(key: str) -> str:
    endpoint = (settings.S3_ENDPOINT or "").rstrip("/")
    bucket = settings.S3_BUCKET
    return f"{endpoint}/{bucket}/{key}"


def upload_bytes(data: bytes, filename: str, content_type: str) -> dict[str, Any]:
    if not storage_configured():
        raise RuntimeError(
            "File storage is not configured. Paste a YouTube or public file URL instead, "
            "or set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET (e.g. Cloudflare R2)."
        )
    ext = ""
    if "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower()[:10]
    key = f"media/{uuid.uuid4().hex}{ext}"
    client = _client()
    try:
        client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type or "application/octet-stream",
            ACL="public-read",
        )
    except Exception:
        client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type or "application/octet-stream",
        )
    return {"key": key, "url": public_url_for_key(key), "content_type": content_type}
