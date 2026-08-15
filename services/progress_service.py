"""Progress Tracking & Photo Pipeline — Milestone 3, Step 3."""

import uuid
from pathlib import Path

from pymongo.database import Database
from sqlalchemy.orm import Session

from core.config import settings
from models.progress_photo import ProgressPhoto
from services import mongo_service, routine_service

PROGRESS_PHOTOS_SUBDIR = "progress_photos"


def compute_adherence(db: Session, mongo_db: Database, user_id: uuid.UUID) -> dict:
    """
    Rolling 7/30/90-day compliance rates: completed routine-log entries vs.
    expected (active AM+PM steps x days). Reuses the same Mongo-backed
    routine_logs collection and Postgres routine-step count introduced in
    Milestone 2 — this is genuinely new math on top of existing data, not
    a new logging pipeline.
    """
    expected_daily_steps = routine_service.count_active_daily_steps(db, user_id)

    rates = {}
    for window, days in (("7d", 7), ("30d", 30), ("90d", 90)):
        completed, expected = mongo_service.compute_consistency_counts(mongo_db, user_id, expected_daily_steps, days)
        rates[window] = round((completed / expected) * 100, 1) if expected else None
    return rates


def save_progress_photo(
    db: Session, user_id: uuid.UUID, filename: str, file_bytes: bytes, tag: str | None, score_at_upload: float | None
) -> ProgressPhoto:
    extension = Path(filename or "").suffix.lower() or ".jpg"
    safe_name = f"{uuid.uuid4().hex}{extension}"

    user_dir = settings.UPLOADS_DIR / PROGRESS_PHOTOS_SUBDIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    (user_dir / safe_name).write_bytes(file_bytes)

    photo = ProgressPhoto(
        user_id=user_id,
        photo_url=f"/uploads/{PROGRESS_PHOTOS_SUBDIR}/{user_id}/{safe_name}",
        tag=tag,
        skin_health_score_at_upload=score_at_upload,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def list_progress_photos(db: Session, user_id: uuid.UUID) -> list[ProgressPhoto]:
    return (
        db.query(ProgressPhoto)
        .filter(ProgressPhoto.user_id == user_id)
        .order_by(ProgressPhoto.uploaded_at.asc())
        .all()
    )


def delete_progress_photo(db: Session, photo: ProgressPhoto) -> None:
    try:
        relative = photo.photo_url.removeprefix("/uploads/")
        path = settings.UPLOADS_DIR / relative
        if path.is_file():
            path.unlink()
    except Exception:  # noqa: BLE001
        pass
    db.delete(photo)
    db.commit()
