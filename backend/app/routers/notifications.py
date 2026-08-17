from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

from app import models
from app.auth import get_current_user
from app.database import get_db, get_mongo_db

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str  # "routine_reminder", "replenishment_alert", "hydration_sleep"
    title: str
    message: str
    is_read: bool
    created_at: str


@router.get("", response_model=List[NotificationOut])
@router.get("/", response_model=List[NotificationOut])
def get_user_notifications(
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve background notifications and reminders for the current user.
    """
    mongo = get_mongo_db()
    notifications = list(mongo.notifications.find({"user_id": current_user.id}).sort("created_at", -1))
    
    results = []
    for n in notifications:
        results.append(NotificationOut(
            id=str(n["_id"]),
            user_id=n.get("user_id"),
            type=n.get("type", "routine_reminder"),
            title=n.get("title", "Skincare Alert"),
            message=n.get("message", ""),
            is_read=n.get("is_read", False),
            created_at=n.get("created_at", datetime.utcnow().isoformat())
        ))
        
    return results


class TriggerNotificationIn(BaseModel):
    notification_type: str  # "routine_reminder", "replenishment_alert", "hydration_sleep"
    product_name: Optional[str] = None
    volume_percentage: Optional[float] = None

@router.post("/trigger", status_code=201)
def trigger_notification_workflow(
    payload: TriggerNotificationIn,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user)
):
    """
    Triggers scheduled notification workflows:
    - Morning/evening skincare reminders
    - Product volume replenishment alerts (<10%)
    - Daily hydration and sleep reminders
    """
    mongo = get_mongo_db()

    title = "Skincare Reminder"
    message = "Time for your scheduled skincare routine!"

    if payload.notification_type == "routine_reminder":
        title = "Routine Reminder"
        message = "Don't forget your morning/evening skincare steps today!"
    elif payload.notification_type == "replenishment_alert":
        p_name = payload.product_name or "Your skincare product"
        vol = payload.volume_percentage if payload.volume_percentage is not None else 8.0
        title = "Replenishment Alert"
        message = f"Warning: {p_name} volume is down to {vol:.1f}%. Restock soon!"
    elif payload.notification_type == "hydration_sleep":
        title = "Hydration & Sleep Reminder"
        message = "Remember to stay hydrated (2L target) and get 8 hours of restful sleep."

    notification_doc = {
        "user_id": current_user.id,
        "type": payload.notification_type,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat()
    }

    mongo.notifications.insert_one(notification_doc)
    return {"status": "success", "message": f"Notification triggered: {title}"}
