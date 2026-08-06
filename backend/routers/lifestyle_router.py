from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Lifestyle, DailyRoutineLog
from role_auth import role_required
from schemas import LifestyleCreate, LifestyleResponse, DailyRoutineLogCreate, DailyRoutineLogResponse
from utils import get_user_id

router = APIRouter(tags=["Lifestyle Tracking"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/lifestyle", response_model=LifestyleResponse)
def create_lifestyle(
    lifestyle: LifestyleCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required(["user", "admin"]))
):
    uid = get_user_id(user)
    existing = db.query(Lifestyle).filter(Lifestyle.user_id == uid).first() if uid else None
    if existing:
        existing.sleep_hours = lifestyle.sleep_hours
        existing.water_intake = lifestyle.water_intake
        existing.exercise = lifestyle.exercise
        existing.stress_level = lifestyle.stress_level
        existing.outdoor_exposure = lifestyle.outdoor_exposure
        existing.diet = lifestyle.diet
        existing.smoking = lifestyle.smoking
        existing.alcohol = lifestyle.alcohol
        existing.sun_exposure = lifestyle.sun_exposure
        existing.environment = lifestyle.environment
        existing.occupation = lifestyle.occupation
        db.commit()
        db.refresh(existing)
        return existing

    new_lifestyle = Lifestyle(
        user_id=uid,
        sleep_hours=lifestyle.sleep_hours,
        water_intake=lifestyle.water_intake,
        exercise=lifestyle.exercise,
        stress_level=lifestyle.stress_level,
        outdoor_exposure=lifestyle.outdoor_exposure,
        diet=lifestyle.diet,
        smoking=lifestyle.smoking,
        alcohol=lifestyle.alcohol,
        sun_exposure=lifestyle.sun_exposure,
        environment=lifestyle.environment,
        occupation=lifestyle.occupation,
    )
    db.add(new_lifestyle)
    db.commit()
    db.refresh(new_lifestyle)
    return new_lifestyle


@router.get("/lifestyle", response_model=LifestyleResponse)
def get_lifestyle(
    db: Session = Depends(get_db),
    user=Depends(role_required(["user", "admin"]))
):
    uid = get_user_id(user)
    l = db.query(Lifestyle).filter(Lifestyle.user_id == uid).first() if uid else None
    if not l:
        l = Lifestyle(
            user_id=uid,
            sleep_hours=7.0,
            water_intake=2.0,
            exercise="3-4 times/week",
            stress_level="Moderate",
            outdoor_exposure="Moderate",
            diet="Balanced",
            smoking=False,
            alcohol=False,
            sun_exposure="Moderate",
            environment="Urban",
            occupation="Indoor"
        )
        db.add(l)
        db.commit()
        db.refresh(l)
    return l


@router.post("/routine/log", response_model=DailyRoutineLogResponse)
def log_routine_completion(
    log_data: DailyRoutineLogCreate,
    db: Session = Depends(get_db),
    user=Depends(role_required(["user", "admin"]))
):
    uid = get_user_id(user)
    today = datetime.utcnow().date()
    log = db.query(DailyRoutineLog).filter(
        DailyRoutineLog.user_id == uid
    ).order_by(DailyRoutineLog.date.desc()).first() if uid else None

    if not log or log.date.date() != today:
        log = DailyRoutineLog(
            user_id=uid,
            date=datetime.utcnow(),
            morning_completed=log_data.morning_completed,
            evening_completed=log_data.evening_completed,
            weekly_completed=log_data.weekly_completed
        )
        db.add(log)
    else:
        log.morning_completed = log_data.morning_completed
        log.evening_completed = log_data.evening_completed
        log.weekly_completed = log_data.weekly_completed

    db.commit()
    db.refresh(log)
    return log
