from functools import lru_cache
from pydantic import field_validator
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

    S3_ENDPOINT: str | None = "http://minio:9000"
    S3_ACCESS_KEY: str | None = "minioadmin"
    S3_SECRET_KEY: str | None = "minioadmin"
    S3_BUCKET: str = "church-media"
    S3_REGION: str = "us-east-1"

    OPENAI_API_KEY: str | None = None
    MUX_TOKEN_ID: str | None = None
    MUX_TOKEN_SECRET: str | None = None

    VAPID_PUBLIC_KEY: str | None = None
    VAPID_PRIVATE_KEY: str | None = None
    VAPID_CONTACT_EMAIL: str = "mailto:admin@example.com"

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    # This validator automatically intercepts and cleans your database URLs
    @field_validator("DATABASE_URL", "DATABASE_URL_SYNC", mode="before")
    @classmethod
    def clean_database_url(cls, v: str) -> str:
        if not v:
            return v
        
        # Clean the async database driver URL
        if "DATABASE_URL" in cls.__fields__ and "asyncpg" not in v:
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Remove the breaking 'sslmode' query parameter that crashes asyncpg
        if "?sslmode=" in v:
            v = v.split("?sslmode=")[0]
        elif "&sslmode=" in v:
            v = v.split("&sslmode=")[0]
            
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
                              
