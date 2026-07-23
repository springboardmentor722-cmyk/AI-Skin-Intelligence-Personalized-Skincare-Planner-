import datetime
from collections.abc import Sequence
from typing import Any, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import get_presigned_url
from app.services.admin.models import AuditLog, VerificationDocument
from app.services.admin.schemas import PlatformCounts, ProfessionalRole, TopConcernStat
from app.services.clinical_review import service as clinical_review_service
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile
from app.services.recommendations.models import Product
from app.services.routines.models import Routine
from app.services.scores.models import SkinScore
from app.services.skin_profile.models import SkinConcern, SkinProfileConcern

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


async def list_documents_for_owner(
    db: AsyncSession, *, owner_user_id: str
) -> list[VerificationDocument]:
    result = await db.execute(
        select(VerificationDocument).where(VerificationDocument.owner_user_id == owner_user_id)
    )
    return list(result.scalars().all())


async def create_document(
    db: AsyncSession,
    *,
    owner_user_id: str,
    document_type: str,
    storage_key: str,
    original_filename: str | None,
) -> VerificationDocument:
    document = VerificationDocument(
        owner_user_id=owner_user_id,
        document_type=document_type,
        storage_key=storage_key,
        original_filename=original_filename,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def get_own_document(
    db: AsyncSession, *, document_id: int, owner_user_id: str
) -> VerificationDocument | None:
    result = await db.execute(
        select(VerificationDocument).where(
            VerificationDocument.document_id == document_id,
            VerificationDocument.owner_user_id == owner_user_id,
        )
    )
    return result.scalar_one_or_none()


async def delete_document(db: AsyncSession, *, document: VerificationDocument) -> None:
    await db.delete(document)
    await db.commit()


async def get_document_view_url(
    db: AsyncSession, *, owner_user_id: str, document_id: int
) -> str | None:
    """A short-lived presigned URL for the admin review UI (Branch 6) to actually
    display an uploaded document — objects are private (docs/ARCHITECTURE.md §7,
    "access via signed URLs only"), never a public bucket URL."""
    result = await db.execute(
        select(VerificationDocument).where(
            VerificationDocument.document_id == document_id,
            VerificationDocument.owner_user_id == owner_user_id,
        )
    )
    document = result.scalar_one_or_none()
    if document is None:
        return None
    return await get_presigned_url(document.storage_key, expires_in=600)


async def assign_client(
    db: AsyncSession, *, actor_user_id: str, professional_id: str, user_id: str
) -> None:
    """No self-service "request a consultant/dermatologist" flow exists yet
    (docs/CONVENTIONS.md/ARCHITECTURE.md don't describe one) — this is the only way
    a real consultant_clients row gets created today. Reuses
    clinical_review_service's own creation function (ADR-005: never touch another
    service's models directly)."""
    await clinical_review_service.create_assignment(db, professional_id, user_id)
    await write_audit_log(
        db,
        actor_user_id=actor_user_id,
        action="consultant_client_assign",
        target_type="consultant_clients",
        target_id=user_id,
        metadata={"professional_id": professional_id},
    )
    await db.commit()


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


async def list_audit_logs(
    db: AsyncSession,
    *,
    action: str | None,
    page: int,
    page_size: int,
) -> tuple[list[AuditLog], int]:
    """Admin's Monitoring screen (Branch 6) — a filterable read over the same
    single-writer table `write_audit_log` populates, newest first. Tiebreaks on
    audit_log_id (not just created_at): `created_at` is `func.now()`, which Postgres
    fixes to the transaction's start time, not per-statement — two writes in the same
    transaction (or just the same clock tick) get identical timestamps, so
    created_at DESC alone doesn't reliably order them."""
    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    result = await db.execute(
        stmt.order_by(AuditLog.created_at.desc().nulls_last(), AuditLog.audit_log_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_pending_verification_counts(db: AsyncSession) -> tuple[int, int]:
    """(consultant, dermatologist) counts of profiles awaiting review — Admin
    dashboard's real, non-invented headline numbers (Branch 6)."""
    consultant_count = (
        await db.execute(
            select(func.count())
            .select_from(ConsultantProfile)
            .where(ConsultantProfile.verification_status == "pending")
        )
    ).scalar_one()
    dermatologist_count = (
        await db.execute(
            select(func.count())
            .select_from(DermatologistProfile)
            .where(DermatologistProfile.verification_status == "pending")
        )
    ).scalar_one()
    return consultant_count, dermatologist_count


async def get_platform_counts(db: AsyncSession) -> PlatformCounts:
    """Milestone 2 P4 — the 3 Admin KPIs with a real backing table each. Platform
    Revenue/System Uptime aren't here; see PlatformCounts' own docstring."""
    total_assessments = (
        await db.execute(select(func.count()).select_from(SkinScore))
    ).scalar_one()
    active_routines = (
        await db.execute(
            select(func.count()).select_from(Routine).where(Routine.is_active.is_(True))
        )
    ).scalar_one()
    total_products = (await db.execute(select(func.count()).select_from(Product))).scalar_one()
    return PlatformCounts(
        total_assessments=total_assessments,
        active_routines=active_routines,
        total_products=total_products,
    )


async def get_top_skin_concerns(db: AsyncSession, limit: int = 5) -> list[TopConcernStat]:
    """Platform-wide concern frequency — how many skin profiles report each concern,
    most common first. Distinct from the per-user prioritisation the Assessment
    Engine computes (scores/service.py) — this is an aggregate, not a ranking of one
    user's concerns."""
    rows = (
        await db.execute(
            select(SkinConcern.concern_name, func.count(SkinProfileConcern.skin_profile_id))
            .select_from(SkinProfileConcern)
            .join(SkinConcern, SkinConcern.concern_id == SkinProfileConcern.concern_id)
            .group_by(SkinConcern.concern_name)
            .order_by(func.count(SkinProfileConcern.skin_profile_id).desc())
            .limit(limit)
        )
    ).all()
    return [
        TopConcernStat(concern_name=name, count=count) for name, count in rows if name is not None
    ]
