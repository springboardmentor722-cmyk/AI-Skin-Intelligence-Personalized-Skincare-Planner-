import uuid
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event as sa_event
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embedder import get_embedder
from app.db.elasticsearch import get_elasticsearch
from app.db.mongo import get_mongo_client
from app.db.postgres import engine, external_user_table
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
    # get_mongo_client() has the exact same @lru_cache-across-event-loops shape —
    # cleared proactively here (Motor tolerates it better than redis-py in practice,
    # but there is no reason to rely on that).
    get_mongo_client.cache_clear()
    # get_elasticsearch() (M3-A) — same shape again.
    get_elasticsearch.cache_clear()
    # get_embedder() (M3-A) — reads settings.ai_impl_embedder; tests that monkeypatch
    # it need a clean cache, not a stale instance from an earlier test.
    get_embedder.cache_clear()


@pytest.fixture(autouse=True)
async def _fresh_engine_pool() -> None:
    # app/db/postgres.py's `engine` is a module-level singleton with its own pooled
    # connections, same cross-event-loop hazard as the two caches above — the
    # `db_session` fixture below is the first thing in this suite to actually check
    # out a connection from it, which is what surfaced this (a pooled connection from
    # a previous test's now-closed loop reused on this test's new one: "Task ... got
    # Future ... attached to a different loop"). Disposing before each test drops any
    # pooled connections so the next checkout opens fresh, bound to the current loop.
    await engine.dispose()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """A real session against the real (live, populated) Postgres, wrapped in an outer
    transaction that's rolled back at teardown — nothing a test does through this
    fixture is ever actually persisted, even though it's a genuine round trip through
    real SQL/constraints/FKs, not a mock. Service functions under test call
    `db.commit()` themselves (e.g. skin_profile_service.create_profile) — an ordinary
    commit would end the outer transaction early and defeat the rollback, so this uses
    the standard SQLAlchemy async pattern for surviving that: bind the session to a
    SAVEPOINT and restart a new one every time the inner code commits, via the
    `after_transaction_end` event. https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites
    """
    async with engine.connect() as connection:
        outer_transaction = await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False)
        # Deliberately untyped (Any): the first value is an AsyncTransaction, but the
        # listener below restarts it via the *sync* connection's begin_nested(), which
        # returns a plain (sync) NestedTransaction — different concrete types, both
        # exposing `.is_active`, which is all this ever reads. Matches SQLAlchemy's own
        # documented recipe for this pattern, which doesn't type-annotate it either.
        nested: Any = await connection.begin_nested()

        @sa_event.listens_for(session.sync_session, "after_transaction_end")
        def _restart_savepoint(sess: object, transaction: object) -> None:
            nonlocal nested
            if not nested.is_active:
                # `connection` is a live AsyncConnection (we're inside its own `async
                # with` block) so `.sync_connection` is always populated here — the
                # `| None` in its type only accounts for a not-yet-connected instance.
                sync_connection = connection.sync_connection
                assert sync_connection is not None
                nested = sync_connection.begin_nested()

        try:
            yield session
        finally:
            await session.close()
            await outer_transaction.rollback()


@pytest.fixture
async def test_user_id(db_session: AsyncSession) -> str:
    """Inserts a throwaway row into Better Auth's `user` table (see
    app/db/postgres.py's `external_user_table`) so FK-constrained inserts
    (skin_profiles.user_id, skin_scores.user_id, ...) have something real to point at.
    Rolled back with everything else in `db_session` — never a real account."""
    user_id = f"test-{uuid.uuid4().hex[:20]}"
    # The real "user" table (Better Auth-owned) has more NOT NULL columns than the FK
    # target alone — `email`, `name`, `emailVerified` — so a raw insert needs them
    # supplied explicitly even though nothing in these tests reads them back.
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id,
            email=f"{user_id}@test.invalid",
            name=f"Test User {user_id}",
            emailVerified=False,
        )
    )
    await db_session.flush()
    return user_id
