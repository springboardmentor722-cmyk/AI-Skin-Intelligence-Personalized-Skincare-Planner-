"""Miscellaneous reusable helper functions."""

import logging
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from core.config import settings
from models.audit import AuditLog
from utils.constants import SKIN_PHOTOS_SUBDIR

logger = logging.getLogger("app.helpers")


def record_audit_log(db: Session, user_id, action: str, details: str = "") -> None:
    """Persist an audit trail entry. Failures here never break the main request."""
    try:
        entry = AuditLog(user_id=user_id, action=action, details=details)
        db.add(entry)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.warning("Failed to record audit log for action '%s': %s", action, exc)


def save_skin_photo(user_id, filename: str, file_bytes: bytes) -> str:
    """
    Persist an uploaded skin photo under uploads/skin_photos/{user_id}/ and
    return the public URL path (served via the /uploads static mount).

    A fresh UUID-based filename is generated so we never trust or expose
    the original filename, and so repeated uploads never collide.
    """
    extension = Path(filename or "").suffix.lower() or ".jpg"
    safe_name = f"{uuid.uuid4().hex}{extension}"

    user_dir = settings.UPLOADS_DIR / SKIN_PHOTOS_SUBDIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    destination = user_dir / safe_name
    destination.write_bytes(file_bytes)

    return f"/uploads/{SKIN_PHOTOS_SUBDIR}/{user_id}/{safe_name}"


def delete_skin_photo_file(photo_url: str | None) -> None:
    """Best-effort delete of a previously stored skin photo from disk."""
    if not photo_url:
        return
    try:
        relative_path = photo_url.removeprefix("/uploads/")
        file_path = settings.UPLOADS_DIR / relative_path
        if file_path.is_file():
            file_path.unlink()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to delete old skin photo '%s': %s", photo_url, exc)

