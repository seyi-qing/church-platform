from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()


def _normalize_database_url(url: str) -> tuple[str, dict]:
    """asyncpg rejects libpq sslmode=; convert for Neon/cloud Postgres."""
    connect_args: dict = {}
    if not url:
        return url, connect_args

    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    sslmode = None
    if "sslmode" in qs:
        sslmode = qs.pop("sslmode")[0]
    if "ssl" in qs:
        sslmode = qs.pop("ssl")[0]

    if sslmode in ("require", "verify-full", "verify-ca", "true", "1") or "neon.tech" in (
        parsed.hostname or ""
    ):
        connect_args["ssl"] = True

    new_query = urlencode({k: v[0] for k, v in qs.items()})
    clean_url = urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )
    return clean_url, connect_args


_db_url, _connect_args = _normalize_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
