import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import build_key, upload
from app.core.storage import delete as delete_object
from app.services.admin import service as admin_service
from app.services.admin.models import VerificationDocument
from app.services.consultant_profile.models import ConsultantProfile
from app.services.consultant_profile.schemas import (
    ConsultantProfileSubmit,
    ConsultantProfileUpdate,
)

# A profile in one of these statuses can be resubmitted (edited + re-reviewed) via
# submit_profile; anything else (pending — already awaiting review; approved/
# suspended/deactivated — not a self-service transition) is a conflict.
_RESUBMITTABLE_STATUSES = {"rejected", "more_info_requested"}


async def get_own_profile(db: AsyncSession, *, user_id: str) -> ConsultantProfile | None:
    result = await db.execute(select(ConsultantProfile).where(ConsultantProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def submit_profile(
    db: AsyncSession, *, user_id: str, data: ConsultantProfileSubmit
) -> ConsultantProfile:
    """Insert (first-ever onboarding submission) or resubmit (after rejected/
    more_info_requested) — never touches a pending/approved/suspended/deactivated
    row. Raises ValueError (router.py maps this to 409) for that last case."""
    existing = await get_own_profile(db, user_id=user_id)

    if existing is None:
        profile = ConsultantProfile(
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
            target_type="consultant",
            target_id=user_id,
        )
        await db.commit()
        await db.refresh(profile)
        return profile

    if existing.verification_status not in _RESUBMITTABLE_STATUSES:
        raise ValueError(
            f"A consultant profile already exists with status "
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
        target_type="consultant",
        target_id=user_id,
    )
    await db.commit()
    await db.refresh(existing)
    return existing


async def update_own_profile(
    db: AsyncSession, *, user_id: str, data: ConsultantProfileUpdate
) -> ConsultantProfile | None:
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


async def list_own_documents(db: AsyncSession, *, user_id: str) -> list[VerificationDocument]:
    return await admin_service.list_documents_for_owner(db, owner_user_id=user_id)


async def upload_document(
    db: AsyncSession,
    *,
    user_id: str,
    document_type: str,
    data: bytes,
    filename: str,
    content_type: str | None,
) -> VerificationDocument:
    key = build_key(prefix="verification-documents", owner_user_id=user_id, filename=filename)
    await upload(key, data, content_type=content_type)
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
