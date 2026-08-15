"""Notification & Reminder System routes."""

import uuid

from fastapi import APIRouter, Depends
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import notification_controller
from core.database import get_db
from core.dependencies import get_current_user
from core.mongodb import get_mongo_db
from models.user import User
from schemas.notification import NotificationListResponse, NotificationResponse

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_controller.get_my_notifications(db, current_user)


@router.post("/generate", response_model=list[NotificationResponse])
def generate_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """
    Called by the frontend on dashboard load. Checks the user's real
    current data (routine completion, hydration, sleep, score trend,
    order age) and creates any reminders that apply — deduplicated per
    day, so this is safe to call repeatedly.
    """
    return notification_controller.generate_reminders(db, mongo_db, current_user)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_controller.mark_read(db, current_user, notification_id)


@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification_controller.mark_all_read(db, current_user)
    return {"message": "All notifications marked as read"}
