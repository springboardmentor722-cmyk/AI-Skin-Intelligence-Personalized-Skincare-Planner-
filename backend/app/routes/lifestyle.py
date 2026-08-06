from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    User,
    Lifestyle,
    SkinProfile,
    SkinAssessment,
)
from app.services.recommendation_manager import regenerate_recommendations
from app.services.recommendation_storage import delete_saved_recommendations
from app.schemas import (
    LifestyleCreate,
    LifestyleUpdate,
    LifestyleResponse
)

router = APIRouter(
    prefix="/lifestyle",
    tags=["Lifestyle"]
)

@router.post("/", response_model=LifestyleResponse)
def create_lifestyle(
    lifestyle: LifestyleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    existing = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == current_user.id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Lifestyle record already exists."
        )

    new_lifestyle = Lifestyle(
        user_id=current_user.id,
        sleep_duration=lifestyle.sleep_duration,
        water_intake=lifestyle.water_intake,
        exercise_habits=lifestyle.exercise_habits,
        stress_level=lifestyle.stress_level,
        environmental_exposure=lifestyle.environmental_exposure
    )

    db.add(new_lifestyle)
    db.commit()
    db.refresh(new_lifestyle)

    return new_lifestyle

@router.get("/", response_model=LifestyleResponse)
def get_lifestyle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == current_user.id)
        .first()
    )

    if not lifestyle:
        raise HTTPException(
            status_code=404,
            detail="Lifestyle record not found."
        )

    return lifestyle

@router.put("/", response_model=LifestyleResponse)
def update_lifestyle(
    lifestyle: LifestyleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    db_lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == current_user.id)
        .first()
    )

    if not db_lifestyle:
        raise HTTPException(
            status_code=404,
            detail="Lifestyle record not found."
        )

    db_lifestyle.sleep_duration = lifestyle.sleep_duration
    db_lifestyle.water_intake = lifestyle.water_intake
    db_lifestyle.exercise_habits = lifestyle.exercise_habits
    db_lifestyle.stress_level = lifestyle.stress_level
    db_lifestyle.environmental_exposure = lifestyle.environmental_exposure

    db.commit()
    db.refresh(db_lifestyle)

# Get skin profile
    skin_profile = (
    db.query(SkinProfile)
    .filter(SkinProfile.user_id == current_user.id)
    .first()
)

# Get latest assessment
    latest_assessment = (
    db.query(SkinAssessment)
    .filter(SkinAssessment.user_id == current_user.id)
    .order_by(SkinAssessment.created_at.desc())
    .first()
)

# Regenerate recommendations if all required data exists
    if skin_profile and latest_assessment:

     delete_saved_recommendations(
        db,
        current_user.id,
    )

    regenerate_recommendations(
        db,
        current_user.id,
        skin_profile,
        latest_assessment,
        db_lifestyle,
    )

    return db_lifestyle

@router.delete("/")
def delete_lifestyle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    db_lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == current_user.id)
        .first()
    )

    if not db_lifestyle:
        raise HTTPException(
            status_code=404,
            detail="Lifestyle record not found."
        )

    db.delete(db_lifestyle)
    db.commit()

    return {
        "message": "Lifestyle record deleted successfully."
    }