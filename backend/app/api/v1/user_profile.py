from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.schemas.user_profile import UserProfileCreate, UserProfileUpdate, UserProfileResponse
from app.services.user_profile import user_profile_service

router = APIRouter()

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return user_profile_service.get_user_profile(db, current_user.id)

@router.post("/me", response_model=UserProfileResponse)
def create_my_profile(
    profile_in: UserProfileCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return user_profile_service.create_user_profile(db, current_user.id, profile_in)

@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return user_profile_service.update_user_profile(db, current_user.id, profile_in)

@router.delete("/me")
def delete_my_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    user_profile_service.delete_user_profile(db, current_user.id)
    return {"message": "User profile deleted successfully"}
