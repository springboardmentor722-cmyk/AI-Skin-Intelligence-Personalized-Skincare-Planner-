from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, user_id: int, title: str, message: str, notification_type: str, event_key: str | None = None) -> Notification | None:
    """Create a local, database-backed notification during an actual state change."""
    if event_key and db.query(Notification.id).filter(Notification.event_key == event_key).first():
        return None
    notification = Notification(user_id=user_id, title=title, message=message, notification_type=notification_type, event_key=event_key)
    db.add(notification)
    return notification
