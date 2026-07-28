"""Profile service — reusable database logic for the Skin Profile module."""

import uuid

from sqlalchemy.orm import Session

from models.skin_profile import SkinProfile
from schemas.profile import SkinProfileCreate, SkinProfileUpdate


def get_skin_profile(db: Session, user_id: uuid.UUID) -> SkinProfile | None:
    return (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == user_id, SkinProfile.is_deleted.is_(False))
        .first()
    )


def create_skin_profile(db: Session, user_id: uuid.UUID, payload: SkinProfileCreate) -> SkinProfile:
    profile = SkinProfile(user_id=user_id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_skin_profile(
    db: Session, profile: SkinProfile, payload: SkinProfileUpdate
) -> SkinProfile:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def delete_skin_profile(db: Session, profile: SkinProfile) -> None:
    profile.is_deleted = True
    db.commit()


def set_skin_photo_url(db: Session, profile: SkinProfile, photo_url: str | None) -> SkinProfile:
    """Update (or clear, when photo_url is None) the stored skin photo URL."""
    profile.skin_photo_url = photo_url
    db.commit()
    db.refresh(profile)
    return profile
