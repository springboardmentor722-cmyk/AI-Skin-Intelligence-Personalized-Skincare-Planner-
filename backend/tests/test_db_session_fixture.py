"""Sanity-checks the db_session/test_user_id fixtures (tests/conftest.py) themselves:
real Postgres round trip, real FK enforcement, and — the whole point — genuinely
rolled back afterward so these tests can safely run against the live project database
without leaving anything behind. If this file ever fails, every other DB-backed test
in this suite is suspect."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import engine, external_user_table
from app.services.skin_profile.models import SkinProfile


async def test_test_user_id_is_a_real_committed_row_within_the_session(
    db_session: AsyncSession, test_user_id: str
) -> None:
    result = await db_session.execute(
        select(external_user_table.c.id).where(external_user_table.c.id == test_user_id)
    )
    assert result.scalar_one() == test_user_id


async def test_fk_constraint_is_real_not_mocked(db_session: AsyncSession) -> None:
    # No such user exists — a real FK violation should reject this, proving the
    # fixture talks to the real, constrained schema rather than an in-memory stub.
    profile = SkinProfile(user_id="definitely-does-not-exist", skin_type_id=1)
    db_session.add(profile)
    try:
        await db_session.flush()
        raised = False
    except IntegrityError:
        raised = True
        await db_session.rollback()
    assert raised, "expected a real FK violation for a nonexistent user_id"


async def test_previous_test_users_do_not_leak_into_a_fresh_connection() -> None:
    # Opens its own connection outside any fixture, deliberately not reusing
    # `db_session` — proves rollback really happened, not just that the fixture
    # *claims* to roll back.
    async with engine.connect() as connection:
        result = await connection.execute(
            select(external_user_table.c.id).where(external_user_table.c.id.like("test-%"))
        )
        leaked = result.scalars().all()
    assert leaked == [], f"found leaked test rows that should have been rolled back: {leaked}"
