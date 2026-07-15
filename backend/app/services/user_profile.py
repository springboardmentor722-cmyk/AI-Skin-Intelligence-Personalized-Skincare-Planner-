from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status

from app.repositories.user_profile import user_profile_repo
from app.schemas.user_profile import UserProfileCreate, UserProfileUpdate
from app.models.user_profile import UserProfile

class UserProfileService:
    def get_user_profile(self, db: Session, user_id: UUID) -> UserProfile:
        profile = user_profile_repo.get_by_user_id(db, user_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User profile not found"
            )
        return profile

    def create_user_profile(self, db: Session, user_id: UUID, profile_in: UserProfileCreate) -> UserProfile:
        existing_profile = user_profile_repo.get_by_user_id(db, user_id)
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile already exists"
            )
        return user_profile_repo.create(db, user_id, profile_in)

    def update_user_profile(self, db: Session, user_id: UUID, profile_in: UserProfileUpdate) -> UserProfile:
        profile = self.get_user_profile(db, user_id)
        return user_profile_repo.update(db, profile, profile_in)

    def delete_user_profile(self, db: Session, user_id: UUID) -> None:
        profile = self.get_user_profile(db, user_id)
        user_profile_repo.delete(db, profile)

user_profile_service = UserProfileService()
