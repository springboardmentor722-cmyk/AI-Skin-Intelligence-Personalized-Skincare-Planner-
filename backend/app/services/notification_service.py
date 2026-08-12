from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, user_id: int, title: str, message: str, notification_type: str) -> Notification:
    """Create a local, database-backed notification during an actual state change."""
    notification = Notification(user_id=user_id, title=title, message=message, notification_type=notification_type)
    db.add(notification)
    return notification
