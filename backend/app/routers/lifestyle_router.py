from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.auth import get_current_user
from app.models.user import User
from fastapi import HTTPException
from app.database.database import get_db
from app.models.lifestyle import Lifestyle
from app.schemas.lifestyle_schema import LifestyleCreate

router = APIRouter(
    prefix="/lifestyle",
    tags=["Lifestyle"]
)
@router.post("/")
def create_lifestyle(
    data: LifestyleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    existing = db.query(Lifestyle).filter(
        Lifestyle.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Lifestyle already exists. Please update it."
        )

    lifestyle = Lifestyle(
        user_id=current_user.id,
        sleep_duration=data.sleep_duration,
        water_intake=data.water_intake,
        exercise=data.exercise,
        stress_level=data.stress_level,
        environmental_exposure=data.environmental_exposure
    )

    db.add(lifestyle)
    db.commit()
    db.refresh(lifestyle)

    return {
        "message": "Lifestyle Added Successfully",
        "data": lifestyle
    }
@router.get("/")
def get_lifestyle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    lifestyle = db.query(Lifestyle).filter(
        Lifestyle.user_id == current_user.id
    ).first()

    if lifestyle is None:
        raise HTTPException(
            status_code=404,
            detail="Lifestyle not found"
        )

    return lifestyle
@router.put("/")
def update_lifestyle(
    data: LifestyleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    lifestyle = db.query(Lifestyle).filter(
        Lifestyle.user_id == current_user.id
    ).first()

    if lifestyle is None:
        raise HTTPException(
            status_code=404,
            detail="Lifestyle not found"
        )

    lifestyle.sleep_duration = data.sleep_duration
    lifestyle.water_intake = data.water_intake
    lifestyle.exercise = data.exercise
    lifestyle.stress_level = data.stress_level
    lifestyle.environmental_exposure = data.environmental_exposure

    db.commit()
    db.refresh(lifestyle)

    return {
        "message": "Lifestyle Updated Successfully",
        "data": lifestyle
    }