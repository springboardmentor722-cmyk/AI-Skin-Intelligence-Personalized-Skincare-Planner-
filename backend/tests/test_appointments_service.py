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
from app.services.appointments.schemas import (
    AppointmentCreate,
    AvailabilityExceptionCreate,
    AvailabilityRule,
)
from app.services.appointments.service import (
    SlotUnavailableError,
    add_exception,
    book_appointment,
    delete_exception,
    get_availability,
    list_exceptions,
    replace_availability,
)
from app.services.clinical_review.service import _verify_assignment
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile
from app.services.notifications.service import list_my_notifications


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


async def _make_available(
    db_session: AsyncSession, provider_id: str, at: datetime.datetime
) -> datetime.datetime:
    """book_appointment now validates start_time against real availability (Fix 1,
    final whole-branch review) — tests booking a "now"-relative time (24h-cutoff
    tests etc.) need a real rule covering it. Rounds `at` down to the nearest 30-min
    mark (so it lands on a slot the default 30-min-duration rule actually generates)
    and gives `provider_id` a full-day rule for that date's weekday. Returns the
    rounded time to book against."""
    aligned = at.replace(minute=0 if at.minute < 30 else 30, second=0, microsecond=0)
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=aligned.weekday(),
                start_time=datetime.time(0, 0),
                end_time=datetime.time(23, 30),
            )
        ],
    )
    return aligned


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
        [
            AvailabilityRule(
                day_of_week=1,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(17, 0),
            )
        ],
    )
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=2,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(17, 0),
            )
        ],
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


async def test_add_exception_rejects_a_partial_start_end_pair(
    db_session: AsyncSession, provider_id: str
) -> None:
    """Fix 5: the DB's own CHECK constraint requires start_time/end_time to both be
    null or both be set — validate it in the service so a malformed pair gets a
    clean 400 instead of an unhandled IntegrityError -> 500."""
    with pytest.raises(ValueError, match="both"):
        await add_exception(
            db_session,
            provider_id,
            AvailabilityExceptionCreate(
                exception_date=datetime.date(2026, 9, 1), start_time=datetime.time(9, 0)
            ),
        )


async def test_add_exception_rejects_end_time_not_after_start_time(
    db_session: AsyncSession, provider_id: str
) -> None:
    """Fix 5: nothing previously stopped a provider from silently "blocking" zero
    time with end_time <= start_time."""
    with pytest.raises(ValueError, match="end_time"):
        await add_exception(
            db_session,
            provider_id,
            AvailabilityExceptionCreate(
                exception_date=datetime.date(2026, 9, 1),
                start_time=datetime.time(10, 0),
                end_time=datetime.time(9, 0),
            ),
        )


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


async def test_compute_available_slots_from_weekly_pattern(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    # 2026-09-07 is a Monday (day_of_week=0).
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
                slot_duration_minutes=30,
            )
        ],
    )
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 7))
    assert [s.start_time.time() for s in slots] == [datetime.time(9, 0), datetime.time(9, 30)]


async def test_compute_available_slots_returns_nothing_for_an_unavailable_day(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    # 2026-09-08 is a Tuesday — no rule for day_of_week=1.
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 8))
    assert slots == []


async def test_compute_available_slots_excludes_a_whole_day_exception(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    await add_exception(
        db_session, provider_id, AvailabilityExceptionCreate(exception_date=datetime.date(2026, 9, 7))
    )
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 7))
    assert slots == []


async def test_compute_available_slots_excludes_an_existing_appointment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import book_appointment, compute_available_slots
    from app.services.appointments.schemas import AppointmentCreate

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    await book_appointment(
        db_session,
        test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 7))
    assert [s.start_time.time() for s in slots] == [datetime.time(9, 30)]


async def test_compute_available_slots_excludes_past_times_for_today(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    today = datetime.datetime.now(datetime.UTC)
    weekday = today.weekday()  # Python: Monday=0, matches this schema's day_of_week
    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=weekday, start_time=datetime.time(0, 0), end_time=datetime.time(23, 30))],
    )
    slots = await compute_available_slots(
        db_session, provider_id, today.date(), now=today
    )
    assert all(s.start_time > today for s in slots)


async def test_book_appointment_creates_pending_row_and_activates_assignment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    appointment = await book_appointment(
        db_session,
        test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    assert appointment.status == "pending"
    assert appointment.provider_role == "consultant"  # derived server-side, not client-supplied

    # consultant_clients row was created/activated as a side effect.
    assignment = await _verify_assignment(db_session, provider_id, test_user_id)
    assert assignment.status == "active"


async def test_book_appointment_rejects_an_overlapping_slot(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    start = datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC)
    await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=start, consultation_mode="video"),
    )

    other_user = f"test-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user, email=f"{other_user}@test.invalid", name="Other User", emailVerified=False
        )
    )
    await db_session.flush()

    with pytest.raises(SlotUnavailableError):
        await book_appointment(
            db_session, other_user,
            AppointmentCreate(provider_id=provider_id, start_time=start, consultation_mode="video"),
        )


async def test_book_appointment_derives_provider_role_for_a_dermatologist(
    db_session: AsyncSession, test_user_id: str
) -> None:
    derm_id = f"test-derm-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=derm_id, email=f"{derm_id}@test.invalid", name="Dr. Derm", emailVerified=False
        )
    )
    db_session.add(DermatologistProfile(user_id=derm_id, verification_status="approved"))
    await db_session.flush()
    await replace_availability(
        db_session,
        derm_id,
        [
            AvailabilityRule(
                day_of_week=1,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )

    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=derm_id,
            start_time=datetime.datetime(2026, 9, 8, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="chat",
        ),
    )
    assert appointment.provider_role == "dermatologist"


async def test_book_appointment_rejects_an_unsupported_consultation_mode(
    db_session: AsyncSession, test_user_id: str
) -> None:
    provider = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=provider, email=f"{provider}@test.invalid", name="Dr. Modes", emailVerified=False
        )
    )
    db_session.add(
        ConsultantProfile(
            user_id=provider, verification_status="approved", consultation_modes=["video", "chat"]
        )
    )
    await db_session.flush()

    with pytest.raises(ValueError, match="not a supported consultation mode"):
        await book_appointment(
            db_session, test_user_id,
            AppointmentCreate(
                provider_id=provider,
                start_time=datetime.datetime(2026, 9, 9, 9, 0, tzinfo=datetime.UTC),
                consultation_mode="in_person",
            ),
        )


async def test_list_my_appointments_matches_either_side_of_the_fk(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import list_my_appointments

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    as_user = await list_my_appointments(db_session, test_user_id)
    as_provider = await list_my_appointments(db_session, provider_id)
    assert len(as_user) == 1
    assert len(as_provider) == 1
    assert as_user[0].appointment_id == as_provider[0].appointment_id


async def test_get_appointment_rejects_a_non_participant(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import get_appointment

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    stranger = f"test-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=stranger, email=f"{stranger}@test.invalid", name="Stranger", emailVerified=False
        )
    )
    await db_session.flush()
    with pytest.raises(ValueError, match="not found"):
        await get_appointment(db_session, stranger, appointment.appointment_id)


async def test_confirm_then_complete_transition(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import complete_appointment, confirm_appointment

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    confirmed = await confirm_appointment(db_session, provider_id, appointment.appointment_id)
    assert confirmed.status == "confirmed"
    completed = await complete_appointment(db_session, provider_id, appointment.appointment_id, notes="Went well")
    assert completed.status == "completed"
    assert completed.notes == "Went well"


async def test_confirm_rejects_a_non_owning_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import confirm_appointment

    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    with pytest.raises(ValueError, match="not found"):
        await confirm_appointment(db_session, test_user_id, appointment.appointment_id)


async def test_cancel_by_user_within_24h_is_rejected(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import cancel_appointment

    near_future = await _make_available(
        db_session, provider_id, datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=near_future, consultation_mode="video"),
    )
    with pytest.raises(PermissionError, match="24"):
        await cancel_appointment(db_session, test_user_id, appointment.appointment_id, reason=None)


async def test_cancel_by_provider_within_24h_is_allowed(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import cancel_appointment

    near_future = await _make_available(
        db_session, provider_id, datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=near_future, consultation_mode="video"),
    )
    cancelled = await cancel_appointment(db_session, provider_id, appointment.appointment_id, reason="Emergency")
    assert cancelled.status == "cancelled"
    assert cancelled.cancelled_by == provider_id


async def test_reschedule_updates_time_and_stamps_original(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import reschedule_appointment

    far_future = await _make_available(
        db_session, provider_id, datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=10)
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=far_future, consultation_mode="video"),
    )
    new_time = far_future + datetime.timedelta(days=1)
    rescheduled = await reschedule_appointment(db_session, test_user_id, appointment.appointment_id, new_time)
    assert rescheduled.start_time == new_time
    assert rescheduled.original_start_time == far_future


async def test_cancel_rejects_an_already_completed_appointment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import (
        cancel_appointment,
        complete_appointment,
        confirm_appointment,
    )

    far_future = await _make_available(
        db_session, provider_id, datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=10)
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=far_future, consultation_mode="video"),
    )
    await confirm_appointment(db_session, provider_id, appointment.appointment_id)
    await complete_appointment(db_session, provider_id, appointment.appointment_id)
    with pytest.raises(ValueError, match="Cannot cancel"):
        await cancel_appointment(db_session, test_user_id, appointment.appointment_id, reason=None)


async def test_booking_notifies_the_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    notifications = await list_my_notifications(db_session, provider_id)
    assert any(n.notification_type == "appointment_booked" for n in notifications)


async def test_reschedule_rejects_an_already_cancelled_appointment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import cancel_appointment, reschedule_appointment

    far_future = await _make_available(
        db_session, provider_id, datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=10)
    )
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=far_future, consultation_mode="video"),
    )
    await cancel_appointment(db_session, test_user_id, appointment.appointment_id, reason="Changed my mind")
    with pytest.raises(ValueError, match="Cannot reschedule"):
        await reschedule_appointment(
            db_session, test_user_id, appointment.appointment_id, far_future + datetime.timedelta(days=1)
        )


def test_appointment_create_rejects_a_naive_start_time() -> None:
    """Final whole-branch review, Fix 1: AppointmentCreate.start_time is now
    AwareDatetime, so a naive (tzinfo-less) value is rejected at the schema layer
    (422 over the real API) before it ever reaches book_appointment — the comparison
    against tz-aware columns would otherwise silently never match."""
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        AppointmentCreate(
            provider_id="whoever",
            start_time=datetime.datetime(2026, 9, 7, 9, 0),  # no tzinfo
            consultation_mode="video",
        )


async def test_book_appointment_rejects_a_time_outside_availability(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    """Final whole-branch review, Fix 1 (Critical): book_appointment used to only
    rely on the DB's EXCLUDE constraint (overlap-with-another-booking) — it never
    checked the requested time actually falls inside the provider's real
    availability. 14:00 is outside this provider's 9-10 rule for the same weekday."""
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
            )
        ],
    )
    with pytest.raises(SlotUnavailableError):
        await book_appointment(
            db_session, test_user_id,
            AppointmentCreate(
                provider_id=provider_id,
                start_time=datetime.datetime(2026, 9, 7, 14, 0, tzinfo=datetime.UTC),
                consultation_mode="video",
            ),
        )


async def test_concurrent_booking_of_the_identical_slot_lets_exactly_one_succeed() -> None:
    """Bundled recommendation from the final whole-branch review: the EXCLUDE
    constraint is the sole concurrency guard (no app-level lock anywhere), but every
    existing test book_appointment sequentially — this proves it under real
    concurrent async DB sessions via asyncio.gather, not just sequentially.

    The shared rollback-wrapped `db_session` fixture is one connection/transaction —
    unsafe to use from two coroutines at once, and a second real connection wouldn't
    see its uncommitted rows anyway. So this test commits its own throwaway rows
    directly against the real engine and cleans them up itself in `finally`, rather
    than using that fixture."""
    import asyncio

    from sqlalchemy import delete

    from app.db.postgres import engine
    from app.services.appointments.models import Appointment
    from app.services.clinical_review.models import ConsultantClient

    provider = f"test-concurrent-provider-{uuid.uuid4().hex[:16]}"
    user_a = f"test-concurrent-a-{uuid.uuid4().hex[:16]}"
    user_b = f"test-concurrent-b-{uuid.uuid4().hex[:16]}"
    start = datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC)  # a Monday

    setup_session = AsyncSession(engine, expire_on_commit=False)
    try:
        await setup_session.execute(
            external_user_table.insert().values(
                [
                    {
                        "id": provider, "email": f"{provider}@test.invalid",
                        "name": "Concurrent Provider", "emailVerified": False,
                    },
                    {
                        "id": user_a, "email": f"{user_a}@test.invalid",
                        "name": "User A", "emailVerified": False,
                    },
                    {
                        "id": user_b, "email": f"{user_b}@test.invalid",
                        "name": "User B", "emailVerified": False,
                    },
                ]
            )
        )
        setup_session.add(ConsultantProfile(user_id=provider, verification_status="approved"))
        await setup_session.commit()
        await replace_availability(
            setup_session,
            provider,
            [
                AvailabilityRule(
                    day_of_week=0,
                    start_time=datetime.time(9, 0),
                    end_time=datetime.time(10, 0),
                )
            ],
        )

        session_a = AsyncSession(engine, expire_on_commit=False)
        session_b = AsyncSession(engine, expire_on_commit=False)
        try:
            appointment_data = AppointmentCreate(
                provider_id=provider, start_time=start, consultation_mode="video"
            )
            results = await asyncio.gather(
                book_appointment(session_a, user_a, appointment_data),
                book_appointment(session_b, user_b, appointment_data),
                return_exceptions=True,
            )
        finally:
            await session_a.close()
            await session_b.close()

        successes = [r for r in results if not isinstance(r, BaseException)]
        failures = [r for r in results if isinstance(r, BaseException)]
        assert len(successes) == 1, results
        assert len(failures) == 1, results
        assert isinstance(failures[0], SlotUnavailableError), failures[0]
    finally:
        await setup_session.execute(delete(Appointment).where(Appointment.provider_id == provider))
        await setup_session.execute(
            delete(ConsultantClient).where(ConsultantClient.consultant_id == provider)
        )
        await setup_session.execute(
            external_user_table.delete().where(
                external_user_table.c.id.in_([provider, user_a, user_b])
            )
        )
        await setup_session.commit()
        await setup_session.close()
