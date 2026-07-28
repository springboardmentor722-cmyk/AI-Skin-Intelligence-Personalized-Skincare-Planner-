"""User controller — profile read/update orchestration."""

from sqlalchemy.orm import Session

from models.user import User
from schemas.user import UserUpdateRequest


def update_user_profile(db: Session, user: User, payload: UserUpdateRequest) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
