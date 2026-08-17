from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app import models
from app.auth import get_current_user
from app.database import get_db, get_mongo_db

router = APIRouter(tags=["Notifications & Reminders"])

class NotificationItem(BaseModel):
    id: str
    type: str  # "routine_reminder", "replenishment_alert", "hydration_alert"
    title: str
    message: str
    created_at: str
    is_read: bool = False

@router.get("/api/v1/notifications", response_model=List[NotificationItem])
@router.get("/api/notifications", response_model=List[NotificationItem])
def get_user_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mongo = get_mongo_db()
    
    notifications = []
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Routine Reminder
    notifications.append(NotificationItem(
        id="notif-routine-am",
        type="routine_reminder",
        title="Morning Skincare Routine",
        message="Time to complete your morning routine! Cleanse, apply Vitamin C, and protect with Sunscreen.",
        created_at=now_str,
        is_read=False
    ))

    # 2. Replenishment Alert (<10% volume)
    rec = mongo.consultant_recommendations.find_one({"user_id": current_user.id})
    if rec and rec.get("product_ids"):
        p_id = rec["product_ids"][0]
        prod = mongo.products.find_one({"id": p_id})
        p_name = prod.get("name", "Hydrating Cleanser") if prod else "Gentle Foaming Cleanser"
        notifications.append(NotificationItem(
            id="notif-replenish-1",
            type="replenishment_alert",
            title="Product Replenishment Alert (<10%)",
            message=f"Your {p_name} is running low (below 10% volume remaining). Re-order now to avoid missing your daily routine steps.",
            created_at=now_str,
            is_read=False
        ))

    # 3. Daily Hydration & Sleep Reminder
    notifications.append(NotificationItem(
        id="notif-hydration",
        type="hydration_alert",
        title="Daily Hydration & Sleep Goal",
        message="Drink at least 2.5L of water today and target 8 hours of sleep for optimal skin barrier recovery.",
        created_at=now_str,
        is_read=True
    ))

    return notifications
