"""Notification controller."""

import uuid

from fastapi import HTTPException, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from models.user import User
from services import notification_service


def get_my_notifications(db: Session, user: User) -> dict:
    notifications = notification_service.list_notifications(db, user.id)
    unread_count = notification_service.count_unread(db, user.id)
    return {"notifications": notifications, "unread_count": unread_count}


def generate_reminders(db: Session, mongo_db: Database, user: User):
    return notification_service.generate_contextual_reminders(db, mongo_db, user.id)


def mark_read(db: Session, user: User, notification_id: uuid.UUID):
    notification = notification_service.mark_read(db, user.id, notification_id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notification


def mark_all_read(db: Session, user: User):
    notification_service.mark_all_read(db, user.id)
