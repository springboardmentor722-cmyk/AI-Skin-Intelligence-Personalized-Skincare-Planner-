"""Skin Profile CRUD routes."""

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from controllers import profile_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.profile import SkinProfileCreate, SkinProfileResponse, SkinProfileUpdate

router = APIRouter(prefix="/api/skin-profile", tags=["Skin Profile"])


@router.post("", response_model=SkinProfileResponse, status_code=status.HTTP_201_CREATED)
def create_skin_profile(
    payload: SkinProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_controller.create_my_skin_profile(db, current_user, payload)


@router.get("", response_model=SkinProfileResponse)
def get_skin_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_controller.get_my_skin_profile(db, current_user)


@router.put("", response_model=SkinProfileResponse)
def update_skin_profile(
    payload: SkinProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_controller.update_my_skin_profile(db, current_user, payload)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_skin_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile_controller.delete_my_skin_profile(db, current_user)


@router.post("/photo", response_model=SkinProfileResponse)
def upload_skin_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Attach or replace the photo on the current user's skin profile."""
    return profile_controller.upload_my_skin_photo(db, current_user, file)


@router.delete("/photo", response_model=SkinProfileResponse)
def delete_skin_photo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove the photo from the current user's skin profile."""
    return profile_controller.delete_my_skin_photo(db, current_user)
