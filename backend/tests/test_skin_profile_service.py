"""Milestone 1 audit: skin_profile/service.py — profile CRUD/versioning (Postgres) had
32% coverage; the lifestyle-log upsert (Mongo) had none. Postgres assertions use
tests/conftest.py's rollback-wrapped `db_session` (real round trip, nothing
persisted). Mongo has no equivalent transaction-rollback mechanism available here, so
`_lifestyle_test_user` scopes every write to one throwaway user_id and deletes it
explicitly in a fixture finalizer — real writes, real cleanup, not a mock.
"""

import datetime
import uuid
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.db.postgres import external_user_table
from app.services.skin_profile.schemas import (
    LifestyleLogCreate,
    SkinProfileConcernInput,
    SkinProfileCreate,
)
from app.services.skin_profile.service import (
    create_profile,
    get_current_profile,
    list_profile_history,
    list_recent_lifestyle_logs,
    list_skin_concerns,
    list_skin_types,
    upsert_lifestyle_log,
)


@pytest.fixture
async def lifestyle_test_user() -> AsyncGenerator[str, None]:
    user_id = f"test-lifestyle-{uuid.uuid4().hex[:16]}"
    try:
        yield user_id
    finally:
        await get_mongo_db()["lifestyle_logs"].delete_many({"user_id": user_id})


# --- Reference data (real, seeded rows — database_schemas/...sql's own INSERTs) ---


async def test_list_skin_types_returns_the_five_seeded_types(db_session: AsyncSession) -> None:
    types = await list_skin_types(db_session)
    names = {t.skin_type_name for t in types}
    assert names == {"Normal", "Dry", "Oily", "Combination", "Sensitive"}


async def test_list_skin_concerns_returns_seeded_concerns(db_session: AsyncSession) -> None:
    concerns = await list_skin_concerns(db_session)
    assert len(concerns) >= 10  # the documented 10, seed script may have added more


# --- Skin profile CRUD/versioning ---


async def test_get_current_profile_is_none_before_any_profile_exists(
    db_session: AsyncSession, test_user_id: str
) -> None:
    assert await get_current_profile(db_session, test_user_id) is None


async def test_create_profile_round_trips_fields_and_concerns(
    db_session: AsyncSession, test_user_id: str
) -> None:
    created = await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=2,
            age_group="25-34",
            allergies="fragrance",
            sensitivities="retinol",
            concerns=[
                SkinProfileConcernInput(concern_id=1, severity_rating=7, priority_level=9),
                SkinProfileConcernInput(concern_id=2, severity_rating=3, priority_level=4),
            ],
        ),
    )

    assert created.skin_type_id == 2
    assert created.age_group == "25-34"
    assert {c.concern_id for c in created.concerns} == {1, 2}

    fetched = await get_current_profile(db_session, test_user_id)
    assert fetched is not None
    assert fetched.skin_profile_id == created.skin_profile_id
    assert len(fetched.concerns) == 2


async def test_create_profile_versions_instead_of_overwriting(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # SkinProfile.__doc__ (models.py): "prior versions are kept (is_current=False)
    # rather than overwritten" — the accept criterion this test verifies directly.
    first = await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=1, concerns=[])
    )
    second = await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=3, concerns=[])
    )

    assert first.skin_profile_id != second.skin_profile_id

    current = await get_current_profile(db_session, test_user_id)
    assert current is not None
    assert current.skin_profile_id == second.skin_profile_id
    assert current.skin_type_id == 3


async def test_list_profile_history_returns_every_version_oldest_first(
    db_session: AsyncSession, test_user_id: str
) -> None:
    first = await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=1,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=8, priority_level=8)],
        ),
    )
    second = await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=1,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=3, priority_level=5)],
        ),
    )

    history = await list_profile_history(db_session, test_user_id)

    assert [p.skin_profile_id for p in history] == [first.skin_profile_id, second.skin_profile_id]
    assert history[0].concerns[0].severity_rating == 8
    assert history[-1].concerns[0].severity_rating == 3


async def test_create_profile_does_not_leak_across_users(db_session: AsyncSession) -> None:
    user_a = f"test-{uuid.uuid4().hex[:16]}"
    user_b = f"test-{uuid.uuid4().hex[:16]}"
    for uid in (user_a, user_b):
        await db_session.execute(
            external_user_table.insert().values(
                id=uid, email=f"{uid}@test.invalid", name="Test User", emailVerified=False
            )
        )
    await db_session.flush()

    await create_profile(db_session, user_a, SkinProfileCreate(skin_type_id=1, concerns=[]))

    assert await get_current_profile(db_session, user_b) is None


# --- Lifestyle logs (Mongo) ---


async def test_upsert_lifestyle_log_is_readable_afterward(lifestyle_test_user: str) -> None:
    await upsert_lifestyle_log(
        lifestyle_test_user,
        LifestyleLogCreate(
            log_date=datetime.date(2026, 7, 9), sleep_hours=7.5, water_intake_liters=2.0
        ),
    )

    logs = await list_recent_lifestyle_logs(lifestyle_test_user)
    assert len(logs) == 1
    assert logs[0]["sleep_hours"] == 7.5


async def test_upsert_lifestyle_log_is_one_per_day_not_append_only(
    lifestyle_test_user: str,
) -> None:
    # docs/WIREFRAMES.md "Skin profile & lifestyle": "one/day upsert" — saving twice on
    # the same log_date must update in place, not create a second document.
    same_day = datetime.date(2026, 7, 9)
    await upsert_lifestyle_log(
        lifestyle_test_user, LifestyleLogCreate(log_date=same_day, sleep_hours=6.0)
    )
    await upsert_lifestyle_log(
        lifestyle_test_user, LifestyleLogCreate(log_date=same_day, sleep_hours=9.0)
    )

    logs = await list_recent_lifestyle_logs(lifestyle_test_user)
    assert len(logs) == 1
    assert logs[0]["sleep_hours"] == 9.0


async def test_upsert_lifestyle_log_different_days_creates_separate_entries(
    lifestyle_test_user: str,
) -> None:
    await upsert_lifestyle_log(
        lifestyle_test_user,
        LifestyleLogCreate(log_date=datetime.date(2026, 7, 8), sleep_hours=7.0),
    )
    await upsert_lifestyle_log(
        lifestyle_test_user,
        LifestyleLogCreate(log_date=datetime.date(2026, 7, 9), sleep_hours=8.0),
    )

    logs = await list_recent_lifestyle_logs(lifestyle_test_user)
    assert len(logs) == 2
