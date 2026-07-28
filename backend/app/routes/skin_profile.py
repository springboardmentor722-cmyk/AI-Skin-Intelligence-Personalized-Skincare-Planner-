from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.postgres import get_db
from app.models.skin_profile import SkinProfile
from app.models.user import User
from app.schemas.skin_profile import SkinProfileCreate, SkinProfileUpdate, SkinProfileResponse

router = APIRouter(prefix="/skin-profile", tags=["Skin Profile"])


@router.post("/", response_model=SkinProfileResponse, status_code=status.HTTP_201_CREATED)
def create_skin_profile(
    payload: SkinProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Skin profile already exists for this user. Use PUT /skin-profile/ to update it.",
        )

    profile = SkinProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/", response_model=SkinProfileResponse)
def get_my_skin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found. Create one first.")
    return profile


@router.put("/", response_model=SkinProfileResponse)
def update_my_skin_profile(
    payload: SkinProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not found. Create one first.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile