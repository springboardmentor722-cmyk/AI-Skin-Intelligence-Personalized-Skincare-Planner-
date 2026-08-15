import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.appointments.models import (
    Appointment,
    AvailabilityException,
    ProviderAvailability,
)
from app.services.appointments.schemas import (
    AppointmentCreate,
    AvailabilityExceptionCreate,
    AvailabilityRule,
    SlotRead,
)
from app.services.clinical_review import service as clinical_review_service
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile
from app.services.notifications import service as notifications_service


def _ranges_overlap(
    a_start: datetime.time, a_end: datetime.time, b_start: datetime.time, b_end: datetime.time
) -> bool:
    return a_start < b_end and b_start < a_end


async def get_availability(db: AsyncSession, provider_id: str) -> list[ProviderAvailability]:
    result = await db.execute(
        select(ProviderAvailability)
        .where(ProviderAvailability.provider_id == provider_id)
        .order_by(ProviderAvailability.day_of_week, ProviderAvailability.start_time)
    )
    return list(result.scalars().all())


async def replace_availability(
    db: AsyncSession, provider_id: str, rules: list[AvailabilityRule]
) -> list[ProviderAvailability]:
    by_day: dict[int, list[AvailabilityRule]] = {}
    for rule in rules:
        by_day.setdefault(rule.day_of_week, []).append(rule)
    for day_rules in by_day.values():
        ordered = sorted(day_rules, key=lambda r: r.start_time)
        for first, second in zip(ordered, ordered[1:], strict=False):
            if _ranges_overlap(first.start_time, first.end_time, second.start_time, second.end_time):
                raise ValueError("Availability ranges overlap on the same day")

    existing = await get_availability(db, provider_id)
    for row in existing:
        await db.delete(row)
    await db.flush()

    saved = [
        ProviderAvailability(
            provider_id=provider_id,
            day_of_week=rule.day_of_week,
            start_time=rule.start_time,
            end_time=rule.end_time,
            slot_duration_minutes=rule.slot_duration_minutes,
        )
        for rule in rules
    ]
    db.add_all(saved)
    await db.commit()
    return saved


async def list_exceptions(db: AsyncSession, provider_id: str) -> list[AvailabilityException]:
    result = await db.execute(
        select(AvailabilityException)
        .where(AvailabilityException.provider_id == provider_id)
        .order_by(AvailabilityException.exception_date)
    )
    return list(result.scalars().all())


async def add_exception(
    db: AsyncSession, provider_id: str, data: AvailabilityExceptionCreate
) -> AvailabilityException:
    exception = AvailabilityException(provider_id=provider_id, **data.model_dump())
    db.add(exception)
    await db.commit()
    return exception


async def delete_exception(db: AsyncSession, provider_id: str, exception_id: int) -> None:
    result = await db.execute(
        select(AvailabilityException).where(
            AvailabilityException.exception_id == exception_id,
            AvailabilityException.provider_id == provider_id,
        )
    )
    exception = result.scalar_one_or_none()
    if exception is None:
        raise ValueError(f"Exception {exception_id} not found for this provider")
    await db.delete(exception)
    await db.commit()


async def compute_available_slots(
    db: AsyncSession,
    provider_id: str,
    target_date: datetime.date,
    now: datetime.datetime | None = None,
) -> list[SlotRead]:
    now = now or datetime.datetime.now(datetime.UTC)
    day_of_week = target_date.weekday()

    rules_result = await db.execute(
        select(ProviderAvailability)
        .where(
            ProviderAvailability.provider_id == provider_id,
            ProviderAvailability.day_of_week == day_of_week,
        )
        .order_by(ProviderAvailability.start_time)
    )
    rules = list(rules_result.scalars().all())
    if not rules:
        return []

    exceptions_result = await db.execute(
        select(AvailabilityException).where(
            AvailabilityException.provider_id == provider_id,
            AvailabilityException.exception_date == target_date,
        )
    )
    exceptions = list(exceptions_result.scalars().all())
    if any(e.start_time is None for e in exceptions):
        return []  # whole day blocked

    existing_result = await db.execute(
        select(Appointment).where(
            Appointment.provider_id == provider_id,
            Appointment.status.in_(("pending", "confirmed")),
            Appointment.start_time >= datetime.datetime.combine(
                target_date, datetime.time.min
            ),
            Appointment.start_time < (datetime.datetime.combine(target_date, datetime.time.min) + datetime.timedelta(days=1)),
        )
    )
    booked_starts = {a.start_time for a in existing_result.scalars().all()}

    slots: list[SlotRead] = []
    for rule in rules:
        cursor = datetime.datetime.combine(target_date, rule.start_time, tzinfo=datetime.UTC)
        end = datetime.datetime.combine(target_date, rule.end_time, tzinfo=datetime.UTC)
        step = datetime.timedelta(minutes=rule.slot_duration_minutes)
        while cursor + step <= end:
            slot_end = cursor + step
            blocked_by_exception = any(
                e.start_time is not None
                and cursor.time() < e.end_time  # type: ignore[operator]
                and e.start_time < slot_end.time()
                for e in exceptions
            )
            if cursor not in booked_starts and not blocked_by_exception and cursor > now:
                slots.append(SlotRead(start_time=cursor, end_time=slot_end))
            cursor = slot_end
    return slots


class SlotUnavailableError(Exception):
    """Raised when the DB's EXCLUDE constraint rejects an overlapping booking —
    the actual concurrency guard; this just gives callers a typed exception instead
    of a raw IntegrityError to catch."""


class AppointmentOwnershipError(ValueError):
    """Raised when the caller isn't the owning provider for this appointment —
    maps to 404, not 400, matching the no-existence-leak pattern every other
    ownership check in this file already uses (get_appointment, cancel_appointment,
    reschedule_appointment)."""


async def _resolve_provider_role(
    db: AsyncSession, provider_id: str
) -> tuple[str, list[str] | None]:
    """Returns (role, consultation_modes) for the provider, derived server-side from
    whichever profile table has a row for provider_id — never trust a client-supplied
    role. consultation_modes is None when the provider hasn't configured any yet."""
    consultant = await db.execute(
        select(ConsultantProfile.consultation_modes).where(
            ConsultantProfile.user_id == provider_id
        )
    )
    consultant_row = consultant.one_or_none()
    if consultant_row is not None:
        return "consultant", consultant_row[0]
    dermatologist = await db.execute(
        select(DermatologistProfile.consultation_modes).where(
            DermatologistProfile.user_id == provider_id
        )
    )
    dermatologist_row = dermatologist.one_or_none()
    if dermatologist_row is not None:
        return "dermatologist", dermatologist_row[0]
    raise ValueError(f"{provider_id} is not a consultant or dermatologist")


async def book_appointment(db: AsyncSession, user_id: str, data: AppointmentCreate) -> Appointment:
    provider_role, consultation_modes = await _resolve_provider_role(db, data.provider_id)
    if consultation_modes and data.consultation_mode not in consultation_modes:
        raise ValueError(
            f"{data.consultation_mode} is not a supported consultation mode for this provider"
        )

    # slot_duration_minutes for this provider (defaults to 30 if no matching rule —
    # matches the availability the slot was computed from).
    duration_result = await db.execute(
        select(ProviderAvailability.slot_duration_minutes)
        .where(
            ProviderAvailability.provider_id == data.provider_id,
            ProviderAvailability.day_of_week == data.start_time.weekday(),
        )
        .limit(1)
    )
    duration_minutes = duration_result.scalar_one_or_none() or 30

    appointment = Appointment(
        user_id=user_id,
        provider_id=data.provider_id,
        provider_role=provider_role,
        consultation_mode=data.consultation_mode,
        start_time=data.start_time,
        end_time=data.start_time + datetime.timedelta(minutes=duration_minutes),
        status="pending",
    )
    db.add(appointment)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise SlotUnavailableError("This appointment slot is no longer available") from exc

    await clinical_review_service.create_assignment(db, data.provider_id, user_id)
    await db.commit()
    await notifications_service.create_notification(
        db, data.provider_id,
        title="New appointment request",
        message="A new appointment request is pending your confirmation.",
        notification_type="appointment_booked",
    )
    return appointment


_CUTOFF = datetime.timedelta(hours=24)
_VALID_TRANSITIONS = {
    "confirm": ("pending", "confirmed"),
    "complete": ("confirmed", "completed"),
    "no_show": ("confirmed", "no_show"),
}


async def list_my_appointments(
    db: AsyncSession,
    caller_id: str,
    status: str | None = None,
    date_from: datetime.datetime | None = None,
    date_to: datetime.datetime | None = None,
) -> list[Appointment]:
    conditions = [or_(Appointment.user_id == caller_id, Appointment.provider_id == caller_id)]
    if status is not None:
        conditions.append(Appointment.status == status)
    if date_from is not None:
        conditions.append(Appointment.start_time >= date_from)
    if date_to is not None:
        conditions.append(Appointment.start_time <= date_to)
    result = await db.execute(
        select(Appointment).where(and_(*conditions)).order_by(Appointment.start_time)
    )
    return list(result.scalars().all())


async def get_appointment(db: AsyncSession, caller_id: str, appointment_id: int) -> Appointment:
    result = await db.execute(
        select(Appointment).where(
            Appointment.appointment_id == appointment_id,
            or_(Appointment.user_id == caller_id, Appointment.provider_id == caller_id),
        )
    )
    appointment = result.scalar_one_or_none()
    if appointment is None:
        raise ValueError(f"Appointment {appointment_id} not found")
    return appointment


async def _get_owned_by_provider(
    db: AsyncSession, provider_id: str, appointment_id: int
) -> Appointment:
    result = await db.execute(
        select(Appointment).where(
            Appointment.appointment_id == appointment_id, Appointment.provider_id == provider_id
        )
    )
    appointment = result.scalar_one_or_none()
    if appointment is None:
        raise AppointmentOwnershipError(f"Appointment {appointment_id} not found for this provider")
    return appointment


async def _transition(
    db: AsyncSession, provider_id: str, appointment_id: int, action: str, **fields: object
) -> Appointment:
    appointment = await _get_owned_by_provider(db, provider_id, appointment_id)
    required_status, next_status = _VALID_TRANSITIONS[action]
    if appointment.status != required_status:
        raise ValueError(f"Cannot {action} an appointment in status '{appointment.status}'")
    appointment.status = next_status
    for field, value in fields.items():
        setattr(appointment, field, value)
    await db.commit()
    return appointment


async def confirm_appointment(
    db: AsyncSession, provider_id: str, appointment_id: int
) -> Appointment:
    appointment = await _transition(db, provider_id, appointment_id, "confirm")
    await notifications_service.create_notification(
        db, appointment.user_id,
        title="Appointment confirmed",
        message="Your appointment has been confirmed.",
        notification_type="appointment_confirmed",
    )
    return appointment


async def complete_appointment(
    db: AsyncSession, provider_id: str, appointment_id: int, notes: str | None = None
) -> Appointment:
    return await _transition(db, provider_id, appointment_id, "complete", notes=notes)


async def mark_no_show(db: AsyncSession, provider_id: str, appointment_id: int) -> Appointment:
    return await _transition(db, provider_id, appointment_id, "no_show")


async def cancel_appointment(
    db: AsyncSession, caller_id: str, appointment_id: int, reason: str | None
) -> Appointment:
    appointment = await get_appointment(db, caller_id, appointment_id)
    if appointment.status not in ("pending", "confirmed"):
        raise ValueError(f"Cannot cancel an appointment in status '{appointment.status}'")
    is_user = caller_id == appointment.user_id
    if is_user and appointment.start_time - datetime.datetime.now(datetime.UTC) < _CUTOFF:
        raise PermissionError("Appointments can only be cancelled at least 24 hours in advance")
    appointment.status = "cancelled"
    appointment.cancelled_by = caller_id
    appointment.cancellation_reason = reason
    await db.commit()
    is_caller_user = caller_id == appointment.user_id
    other_party = appointment.provider_id if is_caller_user else appointment.user_id
    await notifications_service.create_notification(
        db, other_party,
        title="Appointment cancelled",
        message="An appointment has been cancelled.",
        notification_type="appointment_cancelled",
    )
    return appointment


async def reschedule_appointment(
    db: AsyncSession, caller_id: str, appointment_id: int, new_start_time: datetime.datetime
) -> Appointment:
    appointment = await get_appointment(db, caller_id, appointment_id)
    if appointment.status not in ("pending", "confirmed"):
        raise ValueError(f"Cannot reschedule an appointment in status '{appointment.status}'")
    is_user = caller_id == appointment.user_id
    if is_user and appointment.start_time - datetime.datetime.now(datetime.UTC) < _CUTOFF:
        raise PermissionError("Appointments can only be rescheduled at least 24 hours in advance")
    duration = appointment.end_time - appointment.start_time
    if appointment.original_start_time is None:
        appointment.original_start_time = appointment.start_time
    appointment.start_time = new_start_time
    appointment.end_time = new_start_time + duration
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise SlotUnavailableError("This appointment slot is no longer available") from exc
    await db.commit()
    is_caller_user = caller_id == appointment.user_id
    other_party = appointment.provider_id if is_caller_user else appointment.user_id
    await notifications_service.create_notification(
        db, other_party,
        title="Appointment rescheduled",
        message="An appointment has been rescheduled.",
        notification_type="appointment_rescheduled",
    )
    return appointment
