from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc(), Notification.id.desc()).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"count": db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read.is_(False)).count()}


@router.put("/read-all")
def read_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read.is_(False)).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "Notifications marked as read."}


@router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit(); db.refresh(notification)
    return notification
