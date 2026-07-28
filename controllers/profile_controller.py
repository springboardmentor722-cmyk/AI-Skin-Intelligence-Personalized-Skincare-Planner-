"""Skin Profile controller — CRUD orchestration with ownership enforcement."""

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from models.user import User
from schemas.profile import SkinProfileCreate, SkinProfileUpdate
from services import profile_service
from utils.constants import MAX_IMAGE_SIZE_BYTES
from utils.helpers import delete_skin_photo_file, save_skin_photo
from utils.validators import is_valid_image_upload


def get_my_skin_profile(db: Session, user: User):
    profile = profile_service.get_skin_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found")
    return profile


def create_my_skin_profile(db: Session, user: User, payload: SkinProfileCreate):
    existing = profile_service.get_skin_profile(db, user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Skin profile already exists. Use update instead."
        )
    return profile_service.create_skin_profile(db, user.id, payload)


def update_my_skin_profile(db: Session, user: User, payload: SkinProfileUpdate):
    profile = profile_service.get_skin_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found")
    return profile_service.update_skin_profile(db, profile, payload)


def delete_my_skin_profile(db: Session, user: User):
    profile = profile_service.get_skin_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found")
    profile_service.delete_skin_profile(db, profile)


def upload_my_skin_photo(db: Session, user: User, file: UploadFile):
    """
    Attach or replace the photo on the user's skin profile.

    The skin profile must already exist (created via POST /api/skin-profile)
    before a photo can be attached, keeping photo storage tied to a real
    profile record rather than floating unowned files.
    """
    profile = profile_service.get_skin_profile(db, user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create your skin profile before uploading a photo.",
        )

    if not is_valid_image_upload(file.filename, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    file_bytes = file.file.read()
    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be 5 MB or smaller.",
        )
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    previous_photo_url = profile.skin_photo_url
    new_photo_url = save_skin_photo(user.id, file.filename, file_bytes)

    updated_profile = profile_service.set_skin_photo_url(db, profile, new_photo_url)
    delete_skin_photo_file(previous_photo_url)

    return updated_profile


def delete_my_skin_photo(db: Session, user: User):
    profile = profile_service.get_skin_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skin profile not found")

    previous_photo_url = profile.skin_photo_url
    updated_profile = profile_service.set_skin_photo_url(db, profile, None)
    delete_skin_photo_file(previous_photo_url)

    return updated_profile
