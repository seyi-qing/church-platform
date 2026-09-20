from __future__ import annotations

import re
from collections.abc import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Query keys asyncpg rejects (libpq-style)
_ASYNC_PG_FORBIDDEN = {
    "sslmode",
    "channel_binding",
    "sslrootcert",
    "sslcert",
    "sslkey",
    "sslcrl",
    "gssencmode",
    "target_session_attrs",
}


def _normalize_database_url(raw: str) -> tuple[str, dict]:
    """Strip libpq params and enable TLS for cloud Postgres hosts."""
    connect_args: dict = {}
    if not raw:
        return raw, connect_args

    url = raw.strip().strip('"').strip("'")

    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]
    elif not url.startswith("postgresql+asyncpg://"):
        # leave other schemes alone
        pass

    # Hard strip forbidden query params (handles weird encoding)
    for key in _ASYNC_PG_FORBIDDEN:
        url = re.sub(
            rf"([?&]){key}=[^&]*&?",
            lambda m: "?" if m.group(1) == "?" and not m.group(0).endswith("&") else m.group(1) if m.group(1) == "&" else "",
            url,
            flags=re.IGNORECASE,
        )
    url = re.sub(r"\?&", "?", url)
    url = re.sub(r"\?$", "", url)
    url = re.sub(r"&&+", "&", url)

    parsed = urlparse(url)
    pairs = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k.lower() not in _ASYNC_PG_FORBIDDEN]
    clean_query = urlencode(pairs)
    clean_url = urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, clean_query, parsed.fragment)
    )

    host = (parsed.hostname or "").lower()
    if any(
        x in host
        for x in ("neon.tech", "render.com", "amazonaws.com", "supabase.co", "railway.app")
    ):
        connect_args["ssl"] = True

    # Never pass sslmode into connect_args
    connect_args.pop("sslmode", None)

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
