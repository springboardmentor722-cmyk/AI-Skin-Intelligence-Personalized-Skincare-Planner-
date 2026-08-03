from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List, Optional

from app.database import get_db, get_mongo_db
from app import models, schemas
from app.auth import get_current_user
from app.routers.assessment import generate_default_routine

router = APIRouter(prefix="/api/v1/routine", tags=["Skincare Routine"])


@router.post("/generate", response_model=List[schemas.SkincareRoutineStepOut])
def generate_routine_endpoint(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/routine/generate
    Ingests skin type and concern from PostgreSQL profile and seeds a routine.
    """
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="No skin profile found. Please complete the skin assessment form first."
        )

    # Prioritize concern
    concerns_list = []
    if profile.skin_concerns:
        concerns_list = [c.strip() for c in profile.skin_concerns.split(",") if c.strip()]
        
    primary_concern = concerns_list[0] if concerns_list else None
    
    is_sensitive = False
    if profile.skin_sensitivities and "high" in profile.skin_sensitivities.lower():
        is_sensitive = True

    steps = generate_default_routine(
        user_id=current_user.id,
        skin_type=profile.skin_type.value if profile.skin_type else "normal",
        primary_concern=primary_concern,
        is_sensitive=is_sensitive,
        db=db
    )
    return steps


@router.get("/", response_model=List[schemas.SkincareRoutineStepOut])
def get_user_routine(
    user_id: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/routine
    Retrieves all active routine steps for the target user.
    """
    target_user_id = current_user.id
    if user_id and user_id != current_user.id:
        if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
            raise HTTPException(status_code=403, detail="Not authorized to view other users' routines.")
        target_user_id = user_id

    steps = db.query(models.SkincareRoutine).filter(
        models.SkincareRoutine.user_id == target_user_id,
        models.SkincareRoutine.is_active == True
    ).order_by(models.SkincareRoutine.time_of_day, models.SkincareRoutine.step_number).all()
    
    return steps


@router.post("/log", status_code=status.HTTP_200_OK)
def log_routine_step(
    payload: schemas.RoutineStepLogIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    POST /api/v1/routine/log
    Toggles completion status for a step in MongoDB daily logs.
    """
    log_date_str = payload.log_date or date.today().isoformat()
    
    # 1. Look up postgres lifestyle entries for hydration & sleep data to sync
    log_date_obj = date.fromisoformat(log_date_str)
    lifestyle_entry = db.query(models.LifestyleEntry).filter(
        models.LifestyleEntry.user_id == current_user.id,
        models.LifestyleEntry.entry_date == log_date_obj
    ).first()
    
    water_ml = int(lifestyle_entry.water_intake_liters * 1000) if (lifestyle_entry and lifestyle_entry.water_intake_liters) else 2000
    sleep_h = lifestyle_entry.sleep_hours if (lifestyle_entry and lifestyle_entry.sleep_hours) else 8.0
    
    # 2. Get MongoDB collection
    mongo = get_mongo_db()
    
    # Check if a log for this date exists
    existing_log = mongo.routine_logs.find_one({
        "user_id": current_user.id,
        "log_date": log_date_str
    })
    
    if not existing_log:
        completed_steps = []
        if payload.completed:
            completed_steps.append({
                "routine_step_id": payload.routine_step_id,
                "completed_at": datetime.utcnow().isoformat()
            })
            
        new_log = {
            "user_id": current_user.id,
            "log_date": log_date_str,
            "completed_steps": completed_steps,
            "water_intake_ml": water_ml,
            "sleep_hours": sleep_h
        }
        mongo.routine_logs.insert_one(new_log)
    else:
        completed_steps = existing_log.get("completed_steps", [])
        
        # Filter out if it's already there
        completed_steps = [item for item in completed_steps if item.get("routine_step_id") != payload.routine_step_id]
        
        if payload.completed:
            completed_steps.append({
                "routine_step_id": payload.routine_step_id,
                "completed_at": datetime.utcnow().isoformat()
            })
            
        mongo.routine_logs.update_one(
            {"_id": existing_log["_id"]},
            {"$set": {
                "completed_steps": completed_steps,
                "water_intake_ml": water_ml,
                "sleep_hours": sleep_h
            }}
        )
        
    return {"status": "success", "logged": payload.completed}


@router.get("/logs", status_code=status.HTTP_200_OK)
def get_routine_logs_for_date(
    log_date: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    """
    GET /api/v1/routine/logs
    Fetches the logged routine step completions for a specific date (or today).
    """
    log_date_str = log_date or date.today().isoformat()
    mongo = get_mongo_db()
    
    existing_log = mongo.routine_logs.find_one({
        "user_id": current_user.id,
        "log_date": log_date_str
    })
    
    if not existing_log:
        return {"completed_steps": [], "water_intake_ml": 0, "sleep_hours": 0}
        
    # Convert MongoDB _id (ObjectId) to string
    existing_log["id"] = str(existing_log["_id"])
    del existing_log["_id"]
    return existing_log


from pydantic import BaseModel

class RoutineStepOverwriteIn(BaseModel):
    time_of_day: str  # "AM" or "PM"
    step_number: int
    step_category: str

@router.put("/user/{user_id}", response_model=List[schemas.SkincareRoutineStepOut])
def overwrite_user_routine(
    user_id: str,
    payload: List[RoutineStepOverwriteIn],
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators, consultants, or dermatologists can overwrite routines."
        )
        
    # Enforce assignment checks for dermatologist and consultant roles
    if current_user.role == models.RoleEnum.dermatologist:
        patient = db.query(models.User).filter(models.User.id == user_id).first()
        if not patient or patient.assigned_dermatologist_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify unassigned patient's routine.")
    elif current_user.role == models.RoleEnum.skincare_consultant:
        patient = db.query(models.User).filter(models.User.id == user_id).first()
        if not patient or not patient.assigned_dermatologist_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify unassigned patient's routine.")
        collab = db.query(models.ProfessionalMessage).filter(
            models.ProfessionalMessage.consultant_id == current_user.id,
            models.ProfessionalMessage.dermatologist_id == patient.assigned_dermatologist_id
        ).first()
        if not collab:
            raise HTTPException(status_code=403, detail="Not authorized to modify unassigned patient's routine.")
        
    # Deactivate existing routines
    db.query(models.SkincareRoutine).filter(
        models.SkincareRoutine.user_id == user_id
    ).update({"is_active": False})
    
    # Create new steps
    new_steps = []
    for step in payload:
        new_step = models.SkincareRoutine(
            user_id=user_id,
            time_of_day=step.time_of_day,
            step_number=step.step_number,
            step_category=step.step_category,
            is_active=True
        )
        db.add(new_step)
        new_steps.append(new_step)
        
    db.commit()
    for s in new_steps:
        db.refresh(s)
    return new_steps

