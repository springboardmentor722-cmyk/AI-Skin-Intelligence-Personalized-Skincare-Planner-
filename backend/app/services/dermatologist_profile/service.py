import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import VERIFICATION_DOCUMENT_CONTENT_TYPES, build_key, upload
from app.core.storage import delete as delete_object
from app.services.admin import service as admin_service
from app.services.admin.models import VerificationDocument
from app.services.dermatologist_profile.models import DermatologistProfile
from app.services.dermatologist_profile.schemas import (
    DermatologistProfileSubmit,
    DermatologistProfileUpdate,
)

# Same lifecycle rule as consultant_profile/service.py — see that module's docstring.
_RESUBMITTABLE_STATUSES = {"rejected", "more_info_requested"}


async def get_own_profile(db: AsyncSession, *, user_id: str) -> DermatologistProfile | None:
    result = await db.execute(
        select(DermatologistProfile).where(DermatologistProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def submit_profile(
    db: AsyncSession, *, user_id: str, data: DermatologistProfileSubmit
) -> DermatologistProfile:
    """Insert (first-ever onboarding submission) or resubmit (after rejected/
    more_info_requested) — never touches a pending/approved/suspended/deactivated
    row. Raises ValueError (router.py maps this to 409) for that last case."""
    existing = await get_own_profile(db, user_id=user_id)

    if existing is None:
        profile = DermatologistProfile(
            user_id=user_id,
            verification_status="pending",
            submitted_at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None),
            **data.model_dump(),
        )
        db.add(profile)
        await admin_service.write_audit_log(
            db,
            actor_user_id=user_id,
            action="verification_profile_submitted",
            target_type="dermatologist",
            target_id=user_id,
        )
        await db.commit()
        await db.refresh(profile)
        return profile

    if existing.verification_status not in _RESUBMITTABLE_STATUSES:
        raise ValueError(
            f"A dermatologist profile already exists with status "
            f"'{existing.verification_status}' — it cannot be resubmitted."
        )

    for field, value in data.model_dump().items():
        setattr(existing, field, value)
    existing.verification_status = "pending"
    existing.rejection_reason = None
    existing.reviewed_by = None
    existing.reviewed_at = None
    existing.submitted_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)

    await admin_service.write_audit_log(
        db,
        actor_user_id=user_id,
        action="verification_profile_resubmitted",
        target_type="dermatologist",
        target_id=user_id,
    )
    await db.commit()
    await db.refresh(existing)
    return existing


async def update_own_profile(
    db: AsyncSession, *, user_id: str, data: DermatologistProfileUpdate
) -> DermatologistProfile | None:
    """Edits fields without ever touching verification_status — reachable at any
    status, per the onboarding plan's 'view profile, edit profile' requirement."""
    profile = await get_own_profile(db, user_id=user_id)
    if profile is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def apply_verification_transition(
    db: AsyncSession,
    *,
    user_id: str,
    verification_status: str,
    reviewed_by: str,
    reviewed_at: datetime.datetime,
    update_rejection_reason: bool,
    rejection_reason: str | None,
) -> DermatologistProfile | None:
    """Single-writer interface for admin's verification-review actions (ADR-005) —
    admin/service.py resolves action -> status/reason and calls this instead of
    mutating DermatologistProfile directly. Stages the change only (no commit
    here); admin/service.py's apply_verification_action still owns the single
    commit and the write_audit_log call."""
    profile = await get_own_profile(db, user_id=user_id)
    if profile is None:
        return None
    profile.verification_status = verification_status
    profile.reviewed_by = reviewed_by
    profile.reviewed_at = reviewed_at
    if update_rejection_reason:
        profile.rejection_reason = rejection_reason
    return profile


async def list_own_documents(db: AsyncSession, *, user_id: str) -> list[VerificationDocument]:
    return await admin_service.list_documents_for_owner(db, owner_user_id=user_id)


async def upload_document(
    db: AsyncSession,
    *,
    user_id: str,
    document_type: str,
    data: bytes,
    filename: str,
) -> VerificationDocument:
    key = build_key(prefix="verification-documents", owner_user_id=user_id, filename=filename)
    await upload(key, data, allowed_content_types=VERIFICATION_DOCUMENT_CONTENT_TYPES)
    return await admin_service.create_document(
        db,
        owner_user_id=user_id,
        document_type=document_type,
        storage_key=key,
        original_filename=filename,
    )


async def delete_own_document(db: AsyncSession, *, user_id: str, document_id: int) -> bool:
    document = await admin_service.get_own_document(
        db, document_id=document_id, owner_user_id=user_id
    )
    if document is None:
        return False
    await delete_object(document.storage_key)
    await admin_service.delete_document(db, document=document)
    return True
