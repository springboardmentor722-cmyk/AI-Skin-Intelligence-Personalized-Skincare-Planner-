from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.storage import MAX_UPLOAD_BYTES, FileValidationError
from app.db.mongo import get_mongo_db
from app.db.postgres import get_db
from app.services.progress import service
from app.services.progress.schemas import (
    ConcernChangeRead,
    ProgressLogCreate,
    ProgressLogRead,
    ProgressPhotosRead,
    ProgressSummaryRead,
)

router = APIRouter()


@router.get("/progress/me/summary")
async def get_my_progress_summary(
    # Progress Tracking is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> ProgressSummaryRead:
    return await service.get_progress_summary(db, user["id"], days=days)


@router.get("/progress/me/photos")
async def get_my_progress_photos(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProgressPhotosRead:
    return await service.get_progress_photos(db, user["id"])


@router.post("/progress/me/photos", status_code=status.HTTP_201_CREATED)
async def upload_my_progress_photo(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: Annotated[UploadFile, File()],
    tag: Annotated[str | None, Form()] = None,
) -> ProgressPhotosRead:
    # Bounded read (MAX_UPLOAD_BYTES + 1, one call) — never buffers an unbounded
    # body into memory before rejecting an oversized upload (same pattern as
    # consultant_profile/router.py's document upload).
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        await service.upload_progress_photo(
            db, user["id"], data, file.filename or "photo.jpg", tag=tag
        )
    except FileValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await service.get_progress_photos(db, user["id"])


@router.get("/progress/me/logs")
async def get_my_progress_logs(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
) -> list[ProgressLogRead]:
    docs = await service.list_progress_logs(get_mongo_db(), user["id"])
    return [
        ProgressLogRead(
            week_number=doc["week_number"],
            before_image_url=doc.get("before_image"),
            after_image_url=doc.get("after_image"),
            improvement_score=doc.get("improvement_score"),
            concern_changes=[ConcernChangeRead(**c) for c in doc.get("concern_changes", [])],
            trend_summary=doc.get("trend_summary"),
            notes=doc.get("notes"),
            created_at=doc["created_at"],
        )
        for doc in docs
    ]


@router.post("/progress/me/logs", status_code=status.HTTP_201_CREATED)
async def upsert_my_progress_log(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    body: ProgressLogCreate,
) -> ProgressLogRead:
    return await service.upsert_progress_log(db, get_mongo_db(), user["id"], body.notes)
