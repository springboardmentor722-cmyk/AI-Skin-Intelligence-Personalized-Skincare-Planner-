from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.user import User
from app.models.profile import SkinProfile, LifestyleProfile
from app.schemas.profile import OnboardingData

router = APIRouter()

@router.get("/")
def get_onboarding_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    lifestyle_profile = db.query(LifestyleProfile).filter(LifestyleProfile.user_id == current_user.id).first()
    
    return {
        "skin_profile": {
            "skin_type": skin_profile.skin_type if skin_profile else "",
            "age_group": skin_profile.age_group if skin_profile else "",
            "skin_concerns": skin_profile.skin_concerns if skin_profile else "",
            "allergies": skin_profile.allergies if skin_profile else "",
            "sensitivities": skin_profile.sensitivities if skin_profile else ""
        },
        "lifestyle_profile": {
            "sleep_quality": lifestyle_profile.sleep_quality if lifestyle_profile else "",
            "water_intake": lifestyle_profile.water_intake if lifestyle_profile else ""
        }
    }

@router.post("/")
def save_onboarding_data(
    data: OnboardingData,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Save Skin Profile
    skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not skin_profile:
        skin_profile = SkinProfile(user_id=current_user.id)
        db.add(skin_profile)
    
    skin_profile.skin_type = data.skin_profile.skin_type
    skin_profile.age_group = data.skin_profile.age_group
    skin_profile.skin_concerns = data.skin_profile.skin_concerns
    skin_profile.allergies = data.skin_profile.allergies
    skin_profile.sensitivities = data.skin_profile.sensitivities

    # Save Lifestyle Profile
    lifestyle_profile = db.query(LifestyleProfile).filter(LifestyleProfile.user_id == current_user.id).first()
    if not lifestyle_profile:
        lifestyle_profile = LifestyleProfile(user_id=current_user.id)
        db.add(lifestyle_profile)
    
    lifestyle_profile.sleep_quality = data.lifestyle_profile.sleep_quality
    lifestyle_profile.water_intake = data.lifestyle_profile.water_intake

    db.commit()
    return {"message": "Onboarding completed successfully"}
