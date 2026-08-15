"""User profile management routes (available to every authenticated role)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import user_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.user import UserResponse, UserUpdateRequest

router = APIRouter(prefix="/api/profile", tags=["User Profile"])


@router.get("", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("", response_model=UserResponse)
def update_profile(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = user_controller.update_user_profile(db, current_user, payload)
    return UserResponse.model_validate(updated)
