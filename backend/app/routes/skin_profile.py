from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import (
    SkinProfileCreate,
    SkinProfileResponse,
    SkinProfileUpdate
)

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    User,
    SkinProfile,
    Lifestyle,
    SkinAssessment,
)
from app.services.recommendation_manager import regenerate_recommendations
from app.services.recommendation_storage import delete_saved_recommendations
from app.schemas import SkinProfileCreate, SkinProfileResponse

router = APIRouter(
    prefix="/skin-profile",
    tags=["Skin Profile"]
)

@router.post("/", response_model=SkinProfileResponse)
def create_skin_profile(
    profile: SkinProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    existing_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Skin profile already exists."
        )

    new_profile = SkinProfile(
        user_id=current_user.id,
        skin_type=profile.skin_type,
        skin_tone=profile.skin_tone,
        skin_concerns=profile.skin_concerns,
        allergies=profile.allergies,
        sensitivity=profile.sensitivity
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile

@router.get("/", response_model=SkinProfileResponse)
def get_skin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found."
        )

    return profile

@router.put("/", response_model=SkinProfileResponse)
def update_skin_profile(
    profile: SkinProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    db_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    if not db_profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found."
        )

    db_profile.skin_type = profile.skin_type
    db_profile.skin_tone = profile.skin_tone
    db_profile.skin_concerns = profile.skin_concerns
    db_profile.allergies = profile.allergies
    db_profile.sensitivity = profile.sensitivity

    db.commit()
    db.refresh(db_profile)

# Get latest assessment
    latest_assessment = (
    db.query(SkinAssessment)
    .filter(SkinAssessment.user_id == current_user.id)
    .order_by(SkinAssessment.created_at.desc())
    .first()
)

# Get lifestyle
    lifestyle = (
    db.query(Lifestyle)
    .filter(Lifestyle.user_id == current_user.id)
    .first()
)

# Regenerate recommendations if all required data exists
    if latest_assessment and lifestyle:

     delete_saved_recommendations(
        db,
        current_user.id,
    )

    regenerate_recommendations(
        db,
        current_user.id,
        db_profile,
        latest_assessment,
        lifestyle,
    )

    return db_profile

@router.delete("/")
def delete_skin_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    db_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    if not db_profile:
        raise HTTPException(
            status_code=404,
            detail="Skin profile not found."
        )

    db.delete(db_profile)
    db.commit()

    return {
        "message": "Skin profile deleted successfully."
    }