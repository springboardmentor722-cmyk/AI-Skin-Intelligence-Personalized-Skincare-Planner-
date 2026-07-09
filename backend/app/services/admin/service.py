import datetime
from collections.abc import Sequence
from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.admin.models import AuditLog, VerificationDocument
from app.services.admin.schemas import ProfessionalRole
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile

ProfileRow = ConsultantProfile | DermatologistProfile
# Bound via a concrete class literal at each call site (never a role-keyed dict/
# variable) — that's what lets mypy actually narrow the SQLAlchemy attribute access
# below; a runtime `dict[str, type[...]]` dispatch collapses both branches' columns to
# their common `Base` and loses every field.
ProfileT = TypeVar("ProfileT", ConsultantProfile, DermatologistProfile)

# Action name -> the verification_status it transitions the profile to. Matches the
# CheckConstraint on both consultant_profiles/dermatologist_profiles exactly
# (database_schemas/skinlytics_postgresql_schema_v3.sql).
_ACTION_STATUS: dict[str, str] = {
    "approve": "approved",
    "reject": "rejected",
    "request_info": "more_info_requested",
    "suspend": "suspended",
    "deactivate": "deactivated",
}


async def _list_for_model(
    db: AsyncSession, model: type[ProfileT], status: str | None
) -> Sequence[ProfileT]:
    stmt = select(model)
    if status:
        stmt = stmt.where(model.verification_status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


async def _get_for_model(db: AsyncSession, model: type[ProfileT], user_id: str) -> ProfileT | None:
    result = await db.execute(select(model).where(model.user_id == user_id))
    return result.scalar_one_or_none()


async def _get_profile(
    db: AsyncSession, *, role: ProfessionalRole, user_id: str
) -> ProfileRow | None:
    if role == "consultant":
        return await _get_for_model(db, ConsultantProfile, user_id)
    return await _get_for_model(db, DermatologistProfile, user_id)


async def list_verification_queue(
    db: AsyncSession,
    *,
    role: ProfessionalRole | None,
    status: str | None,
    page: int,
    page_size: int,
) -> tuple[list[dict[str, Any]], int]:
    items: list[dict[str, Any]] = []
    if role is None or role == "consultant":
        for consultant in await _list_for_model(db, ConsultantProfile, status):
            items.append(
                {
                    "user_id": consultant.user_id,
                    "role": "consultant",
                    "verification_status": consultant.verification_status,
                    "submitted_at": consultant.submitted_at,
                    "reviewed_at": consultant.reviewed_at,
                }
            )
    if role is None or role == "dermatologist":
        for dermatologist in await _list_for_model(db, DermatologistProfile, status):
            items.append(
                {
                    "user_id": dermatologist.user_id,
                    "role": "dermatologist",
                    "verification_status": dermatologist.verification_status,
                    "submitted_at": dermatologist.submitted_at,
                    "reviewed_at": dermatologist.reviewed_at,
                }
            )
    # Oldest-submitted-first — a review queue, not an arbitrary listing.
    items.sort(key=lambda item: item["submitted_at"] or datetime.datetime.min)
    total = len(items)
    start = (page - 1) * page_size
    return items[start : start + page_size], total


async def get_profile_for_review(
    db: AsyncSession, *, role: ProfessionalRole, user_id: str
) -> tuple[ProfileRow, list[VerificationDocument]] | None:
    profile = await _get_profile(db, role=role, user_id=user_id)
    if profile is None:
        return None
    doc_result = await db.execute(
        select(VerificationDocument).where(VerificationDocument.owner_user_id == user_id)
    )
    return profile, list(doc_result.scalars().all())


async def apply_verification_action(
    db: AsyncSession,
    *,
    role: ProfessionalRole,
    user_id: str,
    action: str,
    reviewer_id: str,
    reason: str | None,
) -> ProfileRow | None:
    profile = await _get_profile(db, role=role, user_id=user_id)
    if profile is None:
        return None

    profile.verification_status = _ACTION_STATUS[action]
    profile.reviewed_by = reviewer_id
    # reviewed_at is a plain TIMESTAMP column (database_schemas/
    # skinlytics_postgresql_schema_v3.sql), not TIMESTAMPTZ — stripped naive to match,
    # same pattern as scores/service.py's `since` calculation.
    profile.reviewed_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    if action == "reject":
        profile.rejection_reason = reason

    await write_audit_log(
        db,
        actor_user_id=reviewer_id,
        action=f"verification_{action}",
        target_type=role,
        target_id=user_id,
        metadata={"reason": reason} if reason else None,
    )
    await db.commit()
    await db.refresh(profile)
    return profile


async def write_audit_log(
    db: AsyncSession,
    *,
    actor_user_id: str | None,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_=metadata,
        ip_address=ip_address,
    )
    db.add(entry)
    await db.flush()
    return entry
