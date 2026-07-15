from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.user_profile import UserProfile
from app.schemas.user_profile import UserProfileCreate, UserProfileUpdate

class UserProfileRepository:
    def get_by_user_id(self, db: Session, user_id: UUID) -> Optional[UserProfile]:
        return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    def create(self, db: Session, user_id: UUID, obj_in: UserProfileCreate) -> UserProfile:
        db_obj = UserProfile(user_id=user_id, **obj_in.model_dump(exclude_unset=True))
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: UserProfile, obj_in: UserProfileUpdate) -> UserProfile:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: UserProfile) -> None:
        db.delete(db_obj)
        db.commit()

user_profile_repo = UserProfileRepository()
