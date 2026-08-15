"""backend/app/services/appointments/service.py — availability CRUD, slot
computation, booking, and status-transition logic. Real Postgres round trips via
tests/conftest.py's rollback-wrapped db_session/test_user_id, same discipline as
every other service (test_clinical_review_service.py's professional_id fixture
pattern for a second, non-`user`-role identity)."""

import datetime
import uuid
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.appointments.schemas import AvailabilityExceptionCreate, AvailabilityRule
from app.services.appointments.service import (
    add_exception,
    delete_exception,
    get_availability,
    list_exceptions,
    replace_availability,
)
from app.services.consultant_profile.models import ConsultantProfile


@pytest.fixture
async def provider_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    user_id = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Dr. Provider", emailVerified=False
        )
    )
    db_session.add(ConsultantProfile(user_id=user_id, verification_status="approved"))
    await db_session.flush()
    yield user_id


async def test_replace_availability_stores_the_full_weekly_pattern(
    db_session: AsyncSession, provider_id: str
) -> None:
    rules = [
        AvailabilityRule(
            day_of_week=1,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
            slot_duration_minutes=30,
        ),
        AvailabilityRule(
            day_of_week=3,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(14, 0),
            slot_duration_minutes=45,
        ),
    ]
    saved = await replace_availability(db_session, provider_id, rules)
    assert {r.day_of_week for r in saved} == {1, 3}

    reloaded = await get_availability(db_session, provider_id)
    assert len(reloaded) == 2


async def test_replace_availability_overwrites_the_previous_pattern(
    db_session: AsyncSession, provider_id: str
) -> None:
    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=1, start_time=datetime.time(9, 0), end_time=datetime.time(17, 0))],
    )
    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=2, start_time=datetime.time(9, 0), end_time=datetime.time(17, 0))],
    )
    reloaded = await get_availability(db_session, provider_id)
    assert [r.day_of_week for r in reloaded] == [2]


async def test_replace_availability_rejects_overlapping_ranges_same_day(
    db_session: AsyncSession, provider_id: str
) -> None:
    rules = [
        AvailabilityRule(day_of_week=1, start_time=datetime.time(9, 0), end_time=datetime.time(13, 0)),
        AvailabilityRule(day_of_week=1, start_time=datetime.time(12, 0), end_time=datetime.time(17, 0)),
    ]
    with pytest.raises(ValueError, match="overlap"):
        await replace_availability(db_session, provider_id, rules)


async def test_add_and_list_exceptions(db_session: AsyncSession, provider_id: str) -> None:
    exc = await add_exception(
        db_session,
        provider_id,
        AvailabilityExceptionCreate(exception_date=datetime.date(2026, 9, 1), reason="Holiday"),
    )
    assert exc.start_time is None and exc.end_time is None  # whole-day block

    exceptions = await list_exceptions(db_session, provider_id)
    assert len(exceptions) == 1


async def test_delete_exception_rejects_a_different_providers_row(
    db_session: AsyncSession, provider_id: str
) -> None:
    other_provider = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_provider, email=f"{other_provider}@test.invalid", name="Other Dr.",
            emailVerified=False,
        )
    )
    await db_session.flush()
    exc = await add_exception(
        db_session, other_provider, AvailabilityExceptionCreate(exception_date=datetime.date(2026, 9, 1))
    )
    with pytest.raises(ValueError, match="not found"):
        await delete_exception(db_session, provider_id, exc.exception_id)
