from collections.abc import AsyncGenerator
from urllib.parse import urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Params Neon/libpq put in the URL that asyncpg does not accept
_ASYNC_PG_STRIP = {
    "sslmode",
    "ssl",
    "channel_binding",
    "options",
    "gssencmode",
    "target_session_attrs",
}


def _normalize_database_url(url: str) -> tuple[str, dict]:
    """Strip libpq query params asyncpg rejects; enable SSL for Neon."""
    connect_args: dict = {}
    if not url:
        return url, connect_args

    parsed = urlparse(url)
    host = parsed.hostname or ""

    # Always use TLS for Neon
    if "neon.tech" in host:
        connect_args["ssl"] = True

    # Drop unsupported query string entirely (safest for asyncpg)
    if parsed.query:
        from urllib.parse import parse_qs, urlencode

        qs = parse_qs(parsed.query)
        for key in list(qs.keys()):
            if key.lower() in _ASYNC_PG_STRIP:
                if key.lower() in ("sslmode", "ssl") and qs[key][0] in (
                    "require",
                    "verify-full",
                    "verify-ca",
                    "true",
                    "1",
                ):
                    connect_args["ssl"] = True
                qs.pop(key)
        new_query = urlencode({k: v[0] for k, v in qs.items()})
    else:
        new_query = ""

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
