from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()


def _normalize_database_url(url: str) -> tuple[str, dict]:
    """
    asyncpg rejects libpq query params like sslmode= and channel_binding=.
    Strip them and enable SSL via connect_args when needed (Neon, etc.).
    """
    connect_args: dict = {}
    if not url:
        return url, connect_args

    # Ensure async driver prefix
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    # Remove params asyncpg does not accept
    sslmode = None
    for key in list(qs.keys()):
        low = key.lower()
        if low == "sslmode":
            sslmode = qs.pop(key)[0]
        elif low in ("channel_binding", "ssl", "sslrootcert", "sslcert", "sslkey"):
            if low == "ssl":
                sslmode = qs.pop(key)[0]
            else:
                qs.pop(key)

    host = parsed.hostname or ""
    needs_ssl = (
        sslmode in ("require", "verify-full", "verify-ca", "true", "1")
        or "neon.tech" in host
        or "render.com" in host
        or "amazonaws.com" in host
    )
    if needs_ssl:
        connect_args["ssl"] = True

    new_query = urlencode({k: v[0] for k, v in qs.items()})
    clean_url = urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )
    return clean_url, connect_args


_db_url, _connect_args = _normalize_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=False,
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
