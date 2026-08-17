from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
from pydantic import BaseModel
from typing import List, Optional

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db, get_mongo_db

router = APIRouter(tags=["Progress Tracking"])


@router.get("/api/progress", response_model=list[schemas.ProgressEntryOut])
@router.get("/api/progress/", response_model=list[schemas.ProgressEntryOut])
def list_my_progress_entries(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ProgressEntry)
        .filter(models.ProgressEntry.user_id == current_user.id)
        .order_by(models.ProgressEntry.entry_date.desc(), models.ProgressEntry.created_at.desc())
        .all()
    )


@router.post("/api/progress", response_model=schemas.ProgressEntryOut, status_code=201)
@router.post("/api/progress/", response_model=schemas.ProgressEntryOut, status_code=201)
def create_progress_entry(
    payload: schemas.ProgressEntryIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = models.ProgressEntry(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

class LogEntryIn(BaseModel):
    entry_date: date
    morning_complete: bool = False
    evening_complete: bool = False
    hydration_liters: float = 0.0
    self_reported_concerns: List[str] = []
    notes: Optional[str] = None

@router.post("/api/v1/progress/log-entry", status_code=201)
@router.post("/api/progress/v1/log-entry", status_code=201)
def log_daily_entry(
    payload: LogEntryIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mongo = get_mongo_db()
    
    # 1. Store or update in MongoDB collection `progress_logs`
    entry_dict = {
        "user_id": current_user.id,
        "entry_date": payload.entry_date.isoformat(),
        "morning_complete": payload.morning_complete,
        "evening_complete": payload.evening_complete,
        "hydration_liters": payload.hydration_liters,
        "self_reported_concerns": payload.self_reported_concerns,
        "notes": payload.notes or "",
        "created_at": datetime.utcnow().isoformat()
    }
    
    mongo.progress_logs.update_one(
        {"user_id": current_user.id, "entry_date": payload.entry_date.isoformat()},
        {"$set": entry_dict},
        upsert=True
    )

    # 2. Synchronize with SQL ProgressEntry for analytics
    existing = db.query(models.ProgressEntry).filter(
        models.ProgressEntry.user_id == current_user.id,
        models.ProgressEntry.entry_date == payload.entry_date
    ).first()

    hydration_score_val = min(10, int(payload.hydration_liters * 5))
    
    if existing:
        existing.hydration_score = hydration_score_val
        if payload.notes:
            existing.notes = payload.notes
        db.commit()
    else:
        new_entry = models.ProgressEntry(
            user_id=current_user.id,
            entry_date=payload.entry_date,
            hydration_score=hydration_score_val,
            notes=payload.notes or "Daily routine check-in logged"
        )
        db.add(new_entry)
        db.commit()
    
    return {"status": "success", "message": "Daily progress log entry recorded successfully."}
