"""backend/app/services/appointments/router.py — auth/ownership behavior not already
covered by test_appointments_service.py. Calls handlers directly (test_routines_router.py's
established pattern), not through an HTTP client."""

import datetime
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.appointments.router import confirm_appointment, create_appointment
from app.services.appointments.schemas import AppointmentCreate
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
