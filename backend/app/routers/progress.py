from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta
import uuid

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db, get_mongo_db

router = APIRouter(tags=["Progress"])

class ProgressLogEntryRequest(BaseModel):
    log_date: Optional[str] = None
    morning_completed: bool = False
    evening_completed: bool = False
    hydration_ml: Optional[float] = 2000.0
    sleep_hours: Optional[float] = 8.0
    notes: Optional[str] = ""
    concerns_reported: Optional[List[str]] = []

@router.post("/api/v1/progress/log-entry")
@router.post("/api/progress/log-entry")
def log_daily_progress_entry(
    payload: ProgressLogEntryRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry_date = payload.log_date or date.today().isoformat()
    
    # 1. SQL Sync
    entry = db.query(models.ProgressEntry).filter(
        models.ProgressEntry.user_id == current_user.id,
        models.ProgressEntry.entry_date == entry_date
    ).first()
    
    notes_str = payload.notes or ""
    if payload.concerns_reported:
        notes_str += f" [Concerns: {', '.join(payload.concerns_reported)}]"
        
    if not entry:
        entry = models.ProgressEntry(
            user_id=current_user.id,
            entry_date=entry_date,
            photo_url=None,
            notes=notes_str,
            rating=5
        )
        db.add(entry)
    else:
        entry.notes = notes_str
    db.commit()
    db.refresh(entry)
    
    # 2. Mongo Sync
    mongo = get_mongo_db()
    mongo.progress_logs.update_one(
        {"user_id": current_user.id, "log_date": entry_date},
        {"$set": {
            "user_id": current_user.id,
            "log_date": entry_date,
            "morning_completed": payload.morning_completed,
            "evening_completed": payload.evening_completed,
            "hydration_ml": payload.hydration_ml,
            "sleep_hours": payload.sleep_hours,
            "notes": payload.notes,
            "concerns_reported": payload.concerns_reported,
            "updated_at": datetime.utcnow().isoformat()
        }},
        upsert=True
    )
    
    return {
        "status": "success",
        "entry_id": entry.id,
        "log_date": entry_date,
        "message": "Progress log entry recorded successfully across SQL and MongoDB."
    }

@router.get("/api/progress/", response_model=List[schemas.ProgressEntryOut])
@router.get("/api/progress", response_model=List[schemas.ProgressEntryOut])
def get_progress_entries(
    user_id: Optional[str] = Query(None, description="Optional target user ID for consultants/dermatologists"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = current_user.id
    if user_id:
        if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
            raise HTTPException(status_code=403, detail="Not authorized to view other users' progress.")
        target_id = user_id

    entries = (
        db.query(models.ProgressEntry)
        .filter(models.ProgressEntry.user_id == target_id)
        .order_by(models.ProgressEntry.entry_date.desc())
        .all()
    )
    return entries

@router.get("/api/v1/analytics")
@router.get("/api/analytics")
def get_progress_analytics(
    days: int = Query(30, description="Analytics timeframe: 7, 30, or 90 days"),
    user_id: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = current_user.id
    if user_id:
        if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
            raise HTTPException(status_code=403, detail="Not authorized to view other users' analytics.")
        target_id = user_id

    cutoff = date.today() - timedelta(days=days)
    entries = (
        db.query(models.ProgressEntry)
        .filter(models.ProgressEntry.user_id == target_id, models.ProgressEntry.entry_date >= cutoff)
        .order_by(models.ProgressEntry.entry_date.asc())
        .all()
    )

    mongo = get_mongo_db()
    logs = list(mongo.progress_logs.find({"user_id": target_id}))

    total_possible = days
    logged_days = len(entries)
    adherence_pct = round((logged_days / total_possible) * 100, 1) if total_possible > 0 else 0.0

    return {
        "timeframe_days": days,
        "adherence_percentage": adherence_pct,
        "total_logged_entries": logged_days,
        "logs_recorded": len(logs)
    }
