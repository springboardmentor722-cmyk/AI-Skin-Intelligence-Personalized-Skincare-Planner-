import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role, require_verified_professional
from app.db.postgres import external_user_table, get_db
from app.services.appointments import service
from app.services.appointments.models import Appointment
from app.services.appointments.schemas import (
    AppointmentCancelUpdate,
    AppointmentCompleteUpdate,
    AppointmentCreate,
    AppointmentRead,
    AppointmentRescheduleUpdate,
    AvailabilityExceptionCreate,
    AvailabilityExceptionRead,
    AvailabilityRead,
    AvailabilityRule,
    AvailabilityUpdate,
    ProviderSummaryRead,
    SlotRead,
)
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile

router = APIRouter(prefix="/appointments")

# Repeated 5x below for the availability-management endpoints — named alias keeps
# each signature under the line-length limit without changing the dependency itself.
VerifiedProfessional = Annotated[
    dict[str, Any], Depends(require_verified_professional("consultant", "dermatologist"))
]


async def _to_read(db: AsyncSession, caller_id: str, appointment: Appointment) -> AppointmentRead:
    other_id = appointment.provider_id if caller_id == appointment.user_id else appointment.user_id
    name_result = await db.execute(
        select(external_user_table.c.name).where(external_user_table.c.id == other_id)
    )
    other_party_name = name_result.scalar_one_or_none()
    return AppointmentRead(
        appointment_id=appointment.appointment_id,
        user_id=appointment.user_id,
        provider_id=appointment.provider_id,
        provider_role=appointment.provider_role,  # type: ignore[arg-type]
        consultation_mode=appointment.consultation_mode,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        status=appointment.status,  # type: ignore[arg-type]
        cancellation_reason=appointment.cancellation_reason,
        original_start_time=appointment.original_start_time,
        notes=appointment.notes,
        other_party_name=other_party_name,
    )


@router.get("/availability/me")
async def get_my_availability(
    user: VerifiedProfessional,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AvailabilityRead:
    rules = await service.get_availability(db, user["id"])
    return AvailabilityRead(rules=[AvailabilityRule.model_validate(r) for r in rules])


@router.put("/availability/me")
async def put_my_availability(
    data: AvailabilityUpdate,
    user: VerifiedProfessional,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AvailabilityRead:
    try:
        rules = await service.replace_availability(db, user["id"], data.rules)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return AvailabilityRead(rules=[AvailabilityRule.model_validate(r) for r in rules])


@router.get("/availability/exceptions")
async def get_my_exceptions(
    user: VerifiedProfessional,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AvailabilityExceptionRead]:
    exceptions = await service.list_exceptions(db, user["id"])
    return [AvailabilityExceptionRead.model_validate(e) for e in exceptions]


@router.post("/availability/exceptions", status_code=status.HTTP_201_CREATED)
async def add_my_exception(
    data: AvailabilityExceptionCreate,
    user: VerifiedProfessional,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AvailabilityExceptionRead:
    try:
        exception = await service.add_exception(db, user["id"], data)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return AvailabilityExceptionRead.model_validate(exception)


@router.delete("/availability/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_exception(
    exception_id: int,
    user: VerifiedProfessional,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await service.delete_exception(db, user["id"], exception_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/providers")
async def list_providers(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    role: str = Query(pattern="^(consultant|dermatologist)$"),
) -> list[ProviderSummaryRead]:
    # Branched rather than a `model = X if ... else Y` variable: mypy --strict widens
    # that ternary to the shared `Base` type and loses every subclass-specific column.
    if role == "consultant":
        result = await db.execute(
            select(ConsultantProfile).where(ConsultantProfile.verification_status == "approved")
        )
    else:
        result = await db.execute(
            select(DermatologistProfile).where(
                DermatologistProfile.verification_status == "approved"
            )
        )
    profiles = result.scalars().all()
    ids = [p.user_id for p in profiles]
    names: dict[str, str | None] = {}
    if ids:
        name_result = await db.execute(
            select(external_user_table.c.id, external_user_table.c.name).where(
                external_user_table.c.id.in_(ids)
            )
        )
        names = {row.id: row.name for row in name_result.all()}
    return [
        ProviderSummaryRead(
            provider_id=p.user_id,
            name=names.get(p.user_id),
            role=role,  # type: ignore[arg-type]
            biography=getattr(p, "biography", None) or getattr(p, "professional_biography", None),
            specializations=p.specializations,
            consultation_modes=p.consultation_modes,
            years_experience=getattr(p, "years_of_experience", None)
            or getattr(p, "years_of_practice", None),
        )
        for p in profiles
    ]


@router.get("/providers/{provider_id}/slots")
async def get_provider_slots(
    provider_id: str,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    date: datetime.date = Query(),
) -> list[SlotRead]:
    return await service.compute_available_slots(db, provider_id, date)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.book_appointment(db, user["id"], data)
    except service.SlotUnavailableError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.get("/me")
async def list_my_appointments(
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    appointment_status: str | None = Query(default=None, alias="status"),
    date_from: datetime.datetime | None = None,
    date_to: datetime.datetime | None = None,
) -> list[AppointmentRead]:
    appointments = await service.list_my_appointments(
        db, user["id"], status=appointment_status, date_from=date_from, date_to=date_to
    )
    return [await _to_read(db, user["id"], a) for a in appointments]


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.get_appointment(db, user["id"], appointment_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.confirm_appointment(db, user["id"], appointment_id)
    except service.AppointmentOwnershipError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: int,
    data: AppointmentCompleteUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.complete_appointment(
            db, user["id"], appointment_id, notes=data.notes
        )
    except service.AppointmentOwnershipError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/no-show")
async def mark_appointment_no_show(
    appointment_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.mark_no_show(db, user["id"], appointment_id)
    except service.AppointmentOwnershipError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    data: AppointmentCancelUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.cancel_appointment(db, user["id"], appointment_id, data.reason)
    except service.InvalidTransitionError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: int,
    data: AppointmentRescheduleUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.reschedule_appointment(
            db, user["id"], appointment_id, data.start_time
        )
    except service.SlotUnavailableError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except service.InvalidTransitionError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)
