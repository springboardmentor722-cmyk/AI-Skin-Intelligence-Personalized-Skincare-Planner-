from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.admin import service
from app.services.admin.schemas import (
    AuditLogCreate,
    AuditLogPage,
    AuditLogRead,
    ConsultantClientAssignmentRequest,
    ConsultantProfileDetail,
    DashboardStats,
    DermatologistProfileDetail,
    DocumentViewUrl,
    IngredientPage,
    ProductPage,
    ProfessionalRole,
    VerificationActionRequest,
    VerificationActionWithReasonRequest,
    VerificationDocumentRead,
    VerificationQueuePage,
    VerificationReviewDetail,
)
from app.services.ingredients import service as ingredients_service
from app.services.recommendations import service as recommendations_service

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


@router.get("/verification-queue/{role}/{user_id}/documents/{document_id}/url")
async def get_verification_document_url(
    role: ProfessionalRole,
    user_id: str,
    document_id: int,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentViewUrl:
    url = await service.get_document_view_url(db, owner_user_id=user_id, document_id=document_id)
    if url is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No such document")
    return DocumentViewUrl(url=url)


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
    return AuditLogRead.model_validate(entry)


@router.post("/consultant-clients", status_code=status.HTTP_204_NO_CONTENT)
async def assign_consultant_client(
    body: ConsultantClientAssignmentRequest,
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    # No self-service "request a consultant/dermatologist" flow exists yet — this is
    # the only way a real consultant_clients row gets created today (a dedicated
    # Admin UI for it is a deliberate follow-up, not built this pass).
    await service.assign_client(
        db, actor_user_id=admin["id"], professional_id=body.professional_id, user_id=body.user_id
    )


@router.get("/audit-logs")
async def get_audit_logs(
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    action: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AuditLogPage:
    items, total = await service.list_audit_logs(db, action=action, page=page, page_size=page_size)
    return AuditLogPage(
        items=[AuditLogRead.model_validate(item) for item in items],
        meta={"page": page, "page_size": page_size, "total": total},  # type: ignore[arg-type]
    )


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStats:
    consultant_count, dermatologist_count = await service.get_pending_verification_counts(db)
    recent, _total = await service.list_audit_logs(db, action=None, page=1, page_size=10)
    return DashboardStats(
        pending_consultant_count=consultant_count,
        pending_dermatologist_count=dermatologist_count,
        recent_activity=[AuditLogRead.model_validate(item) for item in recent],
    )


@router.get("/ingredients")
async def get_ingredients(
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> IngredientPage:
    # Read-only (Branch 6) — full CRUD stays M3 scope, docs/SUGGESTIONS.md.
    items, total = await ingredients_service.list_all_ingredients(
        db, page=page, page_size=page_size
    )
    return IngredientPage(
        items=items,  # type: ignore[arg-type]
        meta={"page": page, "page_size": page_size, "total": total},  # type: ignore[arg-type]
    )


@router.get("/products")
async def get_products(
    admin: Annotated[dict[str, Any], Depends(require_role("admin"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ProductPage:
    # Read-only (Branch 6) — full CRUD stays M3 scope, docs/SUGGESTIONS.md.
    items, total = await recommendations_service.list_all_products(
        db, page=page, page_size=page_size
    )
    return ProductPage(
        items=items,  # type: ignore[arg-type]
        meta={"page": page, "page_size": page_size, "total": total},  # type: ignore[arg-type]
    )
