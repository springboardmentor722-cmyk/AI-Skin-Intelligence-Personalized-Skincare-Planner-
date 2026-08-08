from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
import os
import asyncio

from app.api import deps
from app.models.user import User
from app.models.routine import RoutineLog
from app.models.progress import ProgressPhoto
from app.services.progress_tracking import ProgressTrackingEngine
from app.api.v1.websockets import manager

router = APIRouter()

def trigger_sync(user_id: str):
    try:
        # Create a new event loop for the background task if needed, or use run
        asyncio.run(manager.broadcast_to_user(user_id, {"type": "SYNC_REQUIRED"}))
    except Exception as e:
        print(f"Error triggering sync: {e}")

@router.post("/checkin")
def log_daily_checkin(
    step_id: str,
    background_tasks: BackgroundTasks,
    completed: bool = True,
    notes: str = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Log completion of an AM or PM routine step.
    """
    log = RoutineLog(
        user_id=current_user.id,
        step_id=UUID(step_id),
        is_completed=completed,
        notes=notes,
        completed_at=datetime.now(timezone.utc)
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    background_tasks.add_task(trigger_sync, str(current_user.id))
    return {"status": "success", "log_id": log.id}

@router.post("/upload-photo")
def upload_progress_photo(
    image_url: str,
    background_tasks: BackgroundTasks,
    tag: str = "Weekly",
    skin_health_score: int = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Mock endpoint for Cloud Photo Upload Pipeline. 
    In production, this would handle a direct multipart stream to S3 and then save the returned URL.
    For this milestone, it accepts the image URL and metadata.
    """
    photo = ProgressPhoto(
        user_id=current_user.id,
        image_url=image_url,
        tag=tag,
        skin_health_score=skin_health_score,
        captured_at=datetime.now(timezone.utc)
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    background_tasks.add_task(trigger_sync, str(current_user.id))
    return {"status": "success", "photo_id": photo.id, "image_url": image_url}

@router.get("/analytics")
def get_progress_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Analytics endpoint returning historical score timelines, compliance percentages, and progress photo links.
    """
    adherence_7d = ProgressTrackingEngine.calculate_adherence(db, current_user.id, 7)
    adherence_30d = ProgressTrackingEngine.calculate_adherence(db, current_user.id, 30)
    adherence_90d = ProgressTrackingEngine.calculate_adherence(db, current_user.id, 90)
    
    photos = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == current_user.id).order_by(ProgressPhoto.captured_at.desc()).all()
    
    return {
        "compliance": {
            "7_day": adherence_7d,
            "30_day": adherence_30d,
            "90_day": adherence_90d
        },
        "photos": [
            {
                "id": str(p.id),
                "url": p.image_url,
                "tag": p.tag,
                "score": p.skin_health_score,
                "date": p.captured_at
            }
            for p in photos
        ]
    }
