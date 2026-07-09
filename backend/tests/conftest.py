from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.db.redis import get_redis
from app.main import app


@pytest.fixture(autouse=True)
def _fresh_redis_client() -> None:
    # get_redis() is @lru_cache'd (app/db/redis.py) — correct for a real server, which
    # runs one persistent event loop for the process's whole lifetime, so one client
    # should be reused. pytest-asyncio's default is a *new* event loop per test
    # function, so a client cached from an earlier test holds a connection bound to an
    # already-closed loop — RateLimitMiddleware (added in the Milestone 1 audit) is
    # the first code path that hits real Redis unconditionally on every request
    # regardless of `dependency_overrides`, which is what surfaced this. Clearing the
    # cache before each test forces a fresh client bound to that test's own loop.
    get_redis.cache_clear()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
