from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Church Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "dev-secret-change-me-in-production-please-32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://church:church@db:5432/church"
    DATABASE_URL_SYNC: str = "postgresql://church:church@db:5432/church"
    REDIS_URL: str = "redis://redis:6379/0"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    S3_ENDPOINT: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_BUCKET: str = "church-media"
    S3_REGION: str = "us-east-1"

    OPENAI_API_KEY: str | None = None
    MUX_TOKEN_ID: str | None = None
    MUX_TOKEN_SECRET: str | None = None

    VAPID_PUBLIC_KEY: str | None = None
    VAPID_PRIVATE_KEY: str | None = None
    VAPID_CONTACT_EMAIL: str = "mailto:admin@example.com"

    # Email (Resend) — https://resend.com
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "Grace Church <onboarding@resend.dev>"

    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8081",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
