from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import Notification, User

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# --------------------------
# Get Logged-in User Notifications
# --------------------------
@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == "user":

        notifications = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .all()
        )

    elif current_user.role == "consultant":

        notifications = (
            db.query(Notification)
            .filter(Notification.consultant_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .all()
        )

    elif current_user.role == "dermatologist":

        notifications = (
            db.query(Notification)
            .filter(Notification.dermatologist_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .all()
        )

    else:
        notifications = []

    return notifications


# --------------------------
# Mark Notification as Read
# --------------------------
@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == "user":

      notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    elif current_user.role == "consultant":

      notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.consultant_id == current_user.id,
        )
        .first()
    )

    else:

      notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.dermatologist_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True

    db.commit()

    return {
        "message": "Notification marked as read."
    }