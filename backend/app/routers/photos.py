import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, cv_engine, engine
from ..database import get_db
from ..deps import get_current_user, require_roles

router = APIRouter(prefix="/api/photos", tags=["Photo-Based Skin Analysis"])

MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media", "uploads")
os.makedirs(MEDIA_DIR, exist_ok=True)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB


@router.post("/upload", response_model=schemas.SkinPhotoOut)
async def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WEBP image.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large (max 8MB).")

    user_dir = os.path.join(MEDIA_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(user_dir, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Run the CV analysis immediately on upload.
    result = cv_engine.analyze_face_photo(contents)

    photo = models.SkinPhoto(
        user_id=current_user.id,
        file_path=file_path,
        content_type=file.content_type,
        analyzed=True,
        face_detected=result["face_detected"],
        redness_score=result["redness_score"],
        texture_score=result["texture_score"],
        evenness_score=result["evenness_score"],
        oiliness_score=result["oiliness_score"],
        analysis_notes=result["notes"],
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.get("/mine", response_model=List[schemas.SkinPhotoOut])
def list_my_photos(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.SkinPhoto)
        .filter(models.SkinPhoto.user_id == current_user.id)
        .order_by(models.SkinPhoto.uploaded_at.desc())
        .all()
    )


@router.get("/latest", response_model=schemas.SkinPhotoOut)
def get_latest_photo(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    photo = (
        db.query(models.SkinPhoto)
        .filter(models.SkinPhoto.user_id == current_user.id)
        .order_by(models.SkinPhoto.uploaded_at.desc())
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="No photos uploaded yet.")
    return photo


def _check_photo_access(photo: models.SkinPhoto, current_user: models.User):
    is_owner = photo.user_id == current_user.id
    is_reviewer = current_user.role.value in ("consultant", "dermatologist", "admin")
    if not (is_owner or is_reviewer):
        raise HTTPException(status_code=403, detail="Not authorized to view this photo.")


@router.get("/{photo_id}/image")
def get_photo_image(photo_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    photo = db.query(models.SkinPhoto).filter(models.SkinPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found.")
    _check_photo_access(photo, current_user)
    if not os.path.exists(photo.file_path):
        raise HTTPException(status_code=404, detail="Image file missing on disk.")
    return FileResponse(photo.file_path, media_type=photo.content_type)


@router.get("/user/{user_id}", response_model=List[schemas.SkinPhotoOut])
def list_photos_for_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("consultant", "dermatologist", "admin")),
):
    """Lets consultants/dermatologists/admins review a client's uploaded photo analyses."""
    return (
        db.query(models.SkinPhoto)
        .filter(models.SkinPhoto.user_id == user_id)
        .order_by(models.SkinPhoto.uploaded_at.desc())
        .all()
    )


@router.delete("/{photo_id}")
def delete_photo(photo_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    photo = db.query(models.SkinPhoto).filter(models.SkinPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found.")
    if photo.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo.")
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)
    db.delete(photo)
    db.commit()
    return {"deleted": True}
