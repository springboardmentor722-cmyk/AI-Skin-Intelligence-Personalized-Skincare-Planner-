from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, cache
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Skin Profile"])


@router.get("/me", response_model=schemas.SkinProfileOut)
def get_my_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No skin profile created yet. Create one first.")
    return profile


@router.put("/me", response_model=schemas.SkinProfileOut)
def upsert_my_profile(
    payload: schemas.SkinProfileIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if profile:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = models.SkinProfile(user_id=current_user.id, **payload.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)

    # Profile changed -> cached score and product recommendations are stale.
    cache.cache_delete(f"skin_health_score:{current_user.id}")
    for cat in ["all", "Face Wash", "Moisturizer", "Sunscreen", "Serum", "Toner", "Treatment Products", "Face Masks"]:
        cache.cache_delete(f"product_recs:{current_user.id}:{cat}:10")

    return profile


@router.get("/{user_id}", response_model=schemas.SkinProfileOut)
def get_profile_for_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Allows consultants/dermatologists/admins to view a client's profile."""
    if current_user.role.value not in ("consultant", "dermatologist", "admin") and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
