import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.appointments.models import Appointment, AvailabilityException, ProviderAvailability
from app.services.appointments.schemas import AvailabilityExceptionCreate, AvailabilityRule, SlotRead


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
        select(ProviderAvailability).where(
            ProviderAvailability.provider_id == provider_id,
            ProviderAvailability.day_of_week == day_of_week,
        )
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
