from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.admin import service
from app.services.admin.schemas import (
    AuditLogCreate,
    AuditLogRead,
    ConsultantProfileDetail,
    DermatologistProfileDetail,
    ProfessionalRole,
    VerificationActionRequest,
    VerificationActionWithReasonRequest,
    VerificationDocumentRead,
    VerificationQueuePage,
    VerificationReviewDetail,
)

router = APIRouter(prefix="/admin")

ProfileDetail = ConsultantProfileDetail | DermatologistProfileDetail


def _profile_schema_for(role: ProfessionalRole) -> type[ProfileDetail]:
    return ConsultantProfileDetail if role == "consultant" else DermatologistProfileDetail


@router.get("/verification-queue")
async def get_verification_queue(
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    role: ProfessionalRole | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> VerificationQueuePage:
    items, total = await service.list_verification_queue(
        db, role=role, status=status_filter, page=page, page_size=page_size
    )
    return VerificationQueuePage(
        items=items,  # type: ignore[arg-type]
        meta={"page": page, "page_size": page_size, "total": total},  # type: ignore[arg-type]
    )


@router.get("/verification-queue/{role}/{user_id}")
async def get_verification_review(
    role: ProfessionalRole,
    user_id: str,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VerificationReviewDetail:
    result = await service.get_profile_for_review(db, role=role, user_id=user_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No profile found for this user/role")
    profile, documents = result
    schema_cls = _profile_schema_for(role)
    return VerificationReviewDetail(
        role=role,
        profile=schema_cls.model_validate(profile),
        documents=[VerificationDocumentRead.model_validate(doc) for doc in documents],
    )


async def _run_action(
    *,
    role: ProfessionalRole,
    user_id: str,
    action: str,
    reason: str | None,
    admin: dict[str, Any],
    db: AsyncSession,
) -> ProfileDetail:
    profile = await service.apply_verification_action(
        db,
        role=role,
        user_id=user_id,
        action=action,
        reviewer_id=admin["id"],
        reason=reason,
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No profile found for this user/role")
    return _profile_schema_for(role).model_validate(profile)


@router.post("/verification-queue/{role}/{user_id}/approve")
async def approve_verification(
    role: ProfessionalRole,
    user_id: str,
    body: VerificationActionRequest,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileDetail:
    return await _run_action(
        role=role, user_id=user_id, action="approve", reason=body.reason, admin=admin, db=db
    )


@router.post("/verification-queue/{role}/{user_id}/reject")
async def reject_verification(
    role: ProfessionalRole,
    user_id: str,
    body: VerificationActionWithReasonRequest,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileDetail:
    return await _run_action(
        role=role, user_id=user_id, action="reject", reason=body.reason, admin=admin, db=db
    )


@router.post("/verification-queue/{role}/{user_id}/request-info")
async def request_more_info(
    role: ProfessionalRole,
    user_id: str,
    body: VerificationActionWithReasonRequest,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileDetail:
    return await _run_action(
        role=role, user_id=user_id, action="request_info", reason=body.reason, admin=admin, db=db
    )


@router.post("/verification-queue/{role}/{user_id}/suspend")
async def suspend_professional(
    role: ProfessionalRole,
    user_id: str,
    body: VerificationActionWithReasonRequest,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileDetail:
    return await _run_action(
        role=role, user_id=user_id, action="suspend", reason=body.reason, admin=admin, db=db
    )


@router.post("/verification-queue/{role}/{user_id}/deactivate")
async def deactivate_professional(
    role: ProfessionalRole,
    user_id: str,
    body: VerificationActionRequest,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileDetail:
    return await _run_action(
        role=role, user_id=user_id, action="deactivate", reason=body.reason, admin=admin, db=db
    )


@router.post("/audit-logs", status_code=status.HTTP_201_CREATED)
async def create_audit_log(
    body: AuditLogCreate,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuditLogRead:
    # The one non-verification write path onto `audit_logs` — used by the Next.js
    # admin role-assignment wrapper (Better Auth's own `set-role` action has no audit
    # trail of its own; this is what makes that trail real instead of assumed).
    entry = await service.write_audit_log(
        db,
        actor_user_id=admin["id"],
        action=body.action,
        target_type=body.target_type,
        target_id=body.target_id,
        metadata=body.metadata,
    )
    await db.commit()
    await db.refresh(entry)
    return AuditLogRead(
        audit_log_id=entry.audit_log_id,
        actor_user_id=entry.actor_user_id,
        action=entry.action,
        target_type=entry.target_type,
        target_id=entry.target_id,
        created_at=entry.created_at,
    )
