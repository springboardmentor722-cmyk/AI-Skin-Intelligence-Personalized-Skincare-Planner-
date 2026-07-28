from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, require
from ..models import Notification, ProgressEntry, User
from ..schemas import NotificationOut, ProgressIn, ProgressOut

router = APIRouter(tags=["progress"])


@router.get("/progress/me", response_model=list[ProgressOut])
def my_progress(user: User = Depends(require("progress.read_own")), db: Session = Depends(get_db)):
    rows = db.scalars(select(ProgressEntry).where(ProgressEntry.user_id == user.id)
                      .order_by(ProgressEntry.entry_date.asc())).all()
    return rows


@router.post("/progress/me", response_model=ProgressOut, status_code=201)
def add_progress(body: ProgressIn, request: Request,
                 user: User = Depends(require("progress.create_own")),
                 db: Session = Depends(get_db)):
    entry = ProgressEntry(user_id=user.id, entry_date=body.entry_date or date.today(),
                          **body.model_dump(exclude_unset=True, exclude={"entry_date"}))
    db.add(entry)
    audit(db, request, user, "progress.log", "progress_entry", None, new_value=body.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/notifications/me", response_model=list[NotificationOut])
def my_notifications(user: User = Depends(require("notifications.read_own")),
                     db: Session = Depends(get_db)):
    rows = db.scalars(select(Notification).where(Notification.user_id == user.id)
                      .order_by(Notification.created_at.desc()).limit(100)).all()
    return rows


@router.patch("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int,
              user: User = Depends(require("notifications.update_own")),
              db: Session = Depends(get_db)):
    n = db.get(Notification, notification_id)
    if not n or n.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n
