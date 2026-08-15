"""Progress Tracking controller — Milestone 3, Step 3."""

from fastapi import HTTPException, UploadFile, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from models.user import User
from services import assessment_service, progress_service
from utils.constants import MAX_IMAGE_SIZE_BYTES
from utils.validators import is_valid_image_upload


def upload_progress_photo(db: Session, user: User, file: UploadFile, tag: str | None):
    if not is_valid_image_upload(file.filename, file.content_type):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a JPG, PNG, or WEBP image.")

    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be 5 MB or smaller.")

    latest = assessment_service.get_latest_assessment(db, user.id)
    score_at_upload = latest.overall_score if latest else None

    return progress_service.save_progress_photo(db, user.id, file.filename, file_bytes, tag, score_at_upload)


def list_my_progress_photos(db: Session, user: User):
    return progress_service.list_progress_photos(db, user.id)


def delete_my_progress_photo(db: Session, user: User, photo_id):
    photos = progress_service.list_progress_photos(db, user.id)
    photo = next((p for p in photos if p.id == photo_id), None)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    progress_service.delete_progress_photo(db, photo)


def get_analytics(db: Session, mongo_db: Database, user: User) -> dict:
    """GET /api/v1/progress/analytics — score timeline + adherence + photos + improvement, for the analytics chart."""
    history = assessment_service.get_assessment_history(db, user.id, limit=90)
    adherence = progress_service.compute_adherence(db, mongo_db, user.id)
    photos = progress_service.list_progress_photos(db, user.id)
    improvement = assessment_service.compute_improvement(db, user.id)

    return {
        "score_timeline": [
            {"created_at": a.created_at, "overall_score": a.overall_score} for a in reversed(history)
        ],
        "adherence": adherence,
        "photos": photos,
        "improvement": improvement,
    }
