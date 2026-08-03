from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

from app import models
from app.auth import get_current_user
from app.database import get_mongo_db

router = APIRouter(prefix="/api/checkins", tags=["Routine Check-ins"])

class CheckinIn(BaseModel):
    routine_step_id: str
    time_of_day: str  # "AM" or "PM"
    completed: bool   # True to complete, False to un-complete

class CheckinOut(BaseModel):
    routine_step_id: str
    time_of_day: str
    completed_at: Optional[str] = None
    date: str

@router.post("", response_model=dict)
def log_routine_step(
    payload: CheckinIn,
    current_user: models.User = Depends(get_current_user)
):
    mongo = get_mongo_db()
    today_str = date.today().isoformat()
    
    if payload.completed:
        # Save or update checkin
        mongo.routine_checkins.update_one(
            {
                "user_id": current_user.id,
                "routine_step_id": payload.routine_step_id,
                "date": today_str
            },
            {
                "$set": {
                    "time_of_day": payload.time_of_day,
                    "completed_at": datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )
        return {"status": "success", "message": "Step marked as completed."}
    else:
        # Remove checkin
        mongo.routine_checkins.delete_many({
            "user_id": current_user.id,
            "routine_step_id": payload.routine_step_id,
            "date": today_str
        })
        return {"status": "success", "message": "Step marked as incomplete."}

@router.get("/today", response_model=List[CheckinOut])
def get_today_checkins(
    current_user: models.User = Depends(get_current_user)
):
    mongo = get_mongo_db()
    today_str = date.today().isoformat()
    
    checkins = list(mongo.routine_checkins.find({
        "user_id": current_user.id,
        "date": today_str
    }))
    
    res = []
    for c in checkins:
        res.append({
            "routine_step_id": c.get("routine_step_id"),
            "time_of_day": c.get("time_of_day"),
            "completed_at": c.get("completed_at"),
            "date": c.get("date")
        })
    return res
