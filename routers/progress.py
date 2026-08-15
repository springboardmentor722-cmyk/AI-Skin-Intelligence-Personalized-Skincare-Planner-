"""Progress Tracking & Photo Pipeline routes — Milestone 3, Step 3."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import progress_controller
from core.database import get_db
from core.dependencies import get_current_user
from core.mongodb import get_mongo_db
from models.user import User
from schemas.progress import ProgressAnalyticsResponse, ProgressPhotoResponse

router = APIRouter(prefix="/api/v1/progress", tags=["Progress Tracking"])


@router.post("/photos", response_model=ProgressPhotoResponse, status_code=status.HTTP_201_CREATED)
def upload_photo(
    file: UploadFile = File(...),
    tag: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a dated, tagged progress photo (e.g. "Baseline", "Week 4") for before/after tracking."""
    return progress_controller.upload_progress_photo(db, current_user, file, tag)


@router.get("/photos", response_model=list[ProgressPhotoResponse])
def list_photos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return progress_controller.list_my_progress_photos(db, current_user)


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress_controller.delete_my_progress_photo(db, current_user, photo_id)


@router.get("/analytics", response_model=ProgressAnalyticsResponse)
def analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Score timeline + 7/30/90-day adherence rates + progress photo links, for the analytics chart."""
    return progress_controller.get_analytics(db, mongo_db, current_user)
