from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


@router.patch("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notif = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id, models.Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/generate-reminders")
def generate_reminders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Rule-based reminder generator. In a scheduled/production setup this would
    run as a periodic background job (e.g. cron / Celery beat); here it is
    exposed as an endpoint so the frontend can trigger it (or a scheduler can
    call it) for demo purposes.
    """
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    created = []

    def add_notification(ntype, message):
        notif = models.Notification(user_id=current_user.id, type=ntype, message=message)
        db.add(notif)
        created.append(message)

    last_log = (
        db.query(models.ProgressLog)
        .filter(models.ProgressLog.user_id == current_user.id)
        .order_by(models.ProgressLog.log_date.desc())
        .first()
    )
    if not last_log or last_log.log_date < datetime.utcnow() - timedelta(days=1):
        add_notification("routine_reminder", "Don't forget to log today's skincare routine!")

    if profile and profile.water_intake_liters < 1.5:
        add_notification("hydration", "Your water intake is low - aim for at least 2L today to support skin hydration.")

    if profile and profile.sleep_quality == "poor":
        add_notification("sleep", "Poor sleep can slow skin repair. Try to improve your sleep routine this week.")

    active_routines = (
        db.query(models.Routine)
        .filter(models.Routine.user_id == current_user.id, models.Routine.is_active == True)  # noqa: E712
        .count()
    )
    if active_routines == 0:
        add_notification("platform", "You don't have an active routine yet. Generate one from your dashboard.")

    db.commit()
    return {"created": created}
