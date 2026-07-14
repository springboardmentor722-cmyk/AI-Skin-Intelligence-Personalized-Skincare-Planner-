from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.storage import MAX_UPLOAD_BYTES, FileValidationError
from app.db.postgres import get_db
from app.services.consultant_profile import service
from app.services.consultant_profile.schemas import (
    ConsultantProfileRead,
    ConsultantProfileSubmit,
    ConsultantProfileUpdate,
    DocumentType,
    VerificationDocumentRead,
)

router = APIRouter(prefix="/consultant-profiles")


@router.get("/me")
async def get_my_profile(
    # Only reachable once role has already flipped to "consultant" (Branch 3's
    # require_verified_professional pattern) — a plain "user" account has no
    # profile row yet by construction (submit is what creates the row *and*
    # triggers the role flip, web/app/api/consultant-onboarding/submit/route.ts).
    user: Annotated[dict[str, Any], Depends(require_role("consultant"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConsultantProfileRead:
    profile = await service.get_own_profile(db, user_id=user["id"])
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No consultant profile yet")
    return ConsultantProfileRead.model_validate(profile)


@router.post("/me/submit", status_code=status.HTTP_201_CREATED)
async def submit_my_profile(
    data: ConsultantProfileSubmit,
    # "user" covers the first-ever submission (role hasn't flipped yet at the moment
    # this call happens); "consultant" covers a resubmission after rejection/
    # more-info-requested.
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConsultantProfileRead:
    try:
        profile = await service.submit_profile(db, user_id=user["id"], data=data)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    return ConsultantProfileRead.model_validate(profile)


@router.patch("/me")
async def update_my_profile(
    data: ConsultantProfileUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("consultant"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConsultantProfileRead:
    profile = await service.update_own_profile(db, user_id=user["id"], data=data)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No consultant profile yet")
    return ConsultantProfileRead.model_validate(profile)


@router.get("/me/documents")
async def list_my_documents(
    user: Annotated[dict[str, Any], Depends(require_role("consultant"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[VerificationDocumentRead]:
    documents = await service.list_own_documents(db, user_id=user["id"])
    return [VerificationDocumentRead.model_validate(doc) for doc in documents]


@router.post("/me/documents", status_code=status.HTTP_201_CREATED)
async def upload_my_document(
    user: Annotated[dict[str, Any], Depends(require_role("consultant"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    document_type: Annotated[DocumentType, Form()],
    file: Annotated[UploadFile, File()],
) -> VerificationDocumentRead:
    # Bounded read (MAX_UPLOAD_BYTES + 1, one call) — never buffers an unbounded
    # body into memory before rejecting an oversized upload.
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        document = await service.upload_document(
            db,
            user_id=user["id"],
            document_type=document_type,
            data=data,
            filename=file.filename or "document",
        )
    except FileValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return VerificationDocumentRead.model_validate(document)


@router.delete("/me/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_document(
    document_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("consultant"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    deleted = await service.delete_own_document(db, user_id=user["id"], document_id=document_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No such document")
