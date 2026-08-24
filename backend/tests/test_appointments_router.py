"""backend/app/services/appointments/router.py — auth/ownership behavior not already
covered by test_appointments_service.py. Calls handlers directly (test_routines_router.py's
established pattern), not through an HTTP client."""

import datetime
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.appointments.router import confirm_appointment, create_appointment
from app.services.appointments.schemas import AppointmentCreate, AvailabilityRule
from app.services.appointments.service import replace_availability
from app.services.consultant_profile.models import ConsultantProfile


@pytest.fixture
async def provider_id(db_session: AsyncSession):
    user_id = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Dr. Provider", emailVerified=False
        )
    )
    db_session.add(ConsultantProfile(user_id=user_id, verification_status="approved"))
    await db_session.flush()
    # 2026-09-07 is a Monday (day_of_week=0) — matches every booking's start_time in
    # this file, so tests actually book through real availability now that
    # book_appointment validates it (Fix 1, final whole-branch review).
    await replace_availability(
        db_session,
        user_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    yield user_id


async def test_create_appointment_returns_the_other_partys_name(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    user = {"id": test_user_id, "role": "user", "claims": {}}
    result = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    assert result.other_party_name == "Dr. Provider"
    assert result.status == "pending"


async def test_confirm_appointment_rejects_a_stranger_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from fastapi import HTTPException

    user = {"id": test_user_id, "role": "user", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    stranger_provider = {"id": f"test-{uuid.uuid4().hex[:16]}", "role": "consultant", "claims": {}}
    with pytest.raises(HTTPException) as exc_info:
        await confirm_appointment(created.appointment_id, stranger_provider, db_session)
    assert exc_info.value.status_code == 404


async def test_confirm_appointment_rejects_an_already_confirmed_appointment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from fastapi import HTTPException

    user = {"id": test_user_id, "role": "user", "claims": {}}
    provider = {"id": provider_id, "role": "consultant", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    await confirm_appointment(created.appointment_id, provider, db_session)
    with pytest.raises(HTTPException) as exc_info:
        await confirm_appointment(created.appointment_id, provider, db_session)
    assert exc_info.value.status_code == 400


async def test_create_appointment_books_within_configured_availability(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    """Bundled recommendation from the final whole-branch review: names the
    "books through a real availability pattern" path explicitly (Fix 1) — every
    other test in this file now also exercises it via the `provider_id` fixture,
    which previously never seeded availability at all (the exact test-fixture gap
    that let the Critical finding ship undetected by 669 passing tests)."""
    user = {"id": test_user_id, "role": "user", "claims": {}}
    result = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    assert result.status == "pending"
    assert result.start_time == datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC)


async def test_cancel_appointment_rejects_an_already_cancelled_appointment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    """Fix 3: cancel_appointment's status guard now raises InvalidTransitionError,
    caught before the generic ValueError handler → 400, not 404 (the same
    ownership-vs-validity split Task 7 already applied to confirm/complete/no-show)."""
    from fastapi import HTTPException

    from app.services.appointments.router import cancel_appointment
    from app.services.appointments.schemas import AppointmentCancelUpdate

    user = {"id": test_user_id, "role": "user", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    await cancel_appointment(
        created.appointment_id, AppointmentCancelUpdate(reason=None), user, db_session
    )
    with pytest.raises(HTTPException) as exc_info:
        await cancel_appointment(
            created.appointment_id, AppointmentCancelUpdate(reason=None), user, db_session
        )
    assert exc_info.value.status_code == 400


async def test_create_appointment_persists_and_returns_concern(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    user = {"id": test_user_id, "role": "user", "claims": {}}
    result = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
            concern="Sudden breakout along the jawline.",
        ),
        user,
        db_session,
    )
    assert result.concern == "Sudden breakout along the jawline."
    assert result.meeting_link is None


async def test_set_meeting_link_by_owning_provider_returns_it(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.router import set_appointment_meeting_link
    from app.services.appointments.schemas import AppointmentMeetingLinkUpdate

    user = {"id": test_user_id, "role": "user", "claims": {}}
    provider = {"id": provider_id, "role": "consultant", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    result = await set_appointment_meeting_link(
        created.appointment_id,
        AppointmentMeetingLinkUpdate(meeting_link="https://meet.google.com/abc-defg-hij"),
        provider,
        db_session,
    )
    assert result.meeting_link == "https://meet.google.com/abc-defg-hij"


async def test_set_meeting_link_rejects_a_stranger_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from fastapi import HTTPException

    from app.services.appointments.router import set_appointment_meeting_link
    from app.services.appointments.schemas import AppointmentMeetingLinkUpdate

    user = {"id": test_user_id, "role": "user", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    stranger_provider = {"id": f"test-{uuid.uuid4().hex[:16]}", "role": "consultant", "claims": {}}
    with pytest.raises(HTTPException) as exc_info:
        await set_appointment_meeting_link(
            created.appointment_id,
            AppointmentMeetingLinkUpdate(meeting_link="https://meet.google.com/x"),
            stranger_provider,
            db_session,
        )
    assert exc_info.value.status_code == 404


async def test_cancel_appointment_rejects_a_non_participant_as_404(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    """Fix 3's ruling requires confirming the ownership-miss case is unaffected: a
    non-participant caller must still get 404 (existence not leaked), not 400."""
    from fastapi import HTTPException

    from app.services.appointments.router import cancel_appointment
    from app.services.appointments.schemas import AppointmentCancelUpdate

    user = {"id": test_user_id, "role": "user", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    stranger = {"id": f"test-{uuid.uuid4().hex[:16]}", "role": "user", "claims": {}}
    with pytest.raises(HTTPException) as exc_info:
        await cancel_appointment(
            created.appointment_id, AppointmentCancelUpdate(reason=None), stranger, db_session
        )
    assert exc_info.value.status_code == 404
