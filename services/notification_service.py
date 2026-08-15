"""
Notification & Reminder System.

Two kinds of notifications, both real and backed by actual data:

1. Event-triggered — created immediately when something happens (a
   consultant recommends a product, refers you to a dermatologist, an
   appointment status changes, a provider overwrites your routine). These
   are called directly from the controllers where those events happen.

2. Contextual reminders — computed on demand from the user's own current
   data (routine completion, lifestyle logs, score trend, order age) via
   generate_contextual_reminders(). There's no cron/task scheduler in this
   app, so these are generated lazily: the frontend calls
   POST /api/v1/notifications/generate on dashboard load, which checks
   real conditions and creates a notification only if one doesn't already
   exist for that user+kind+day (via `dedupe_key`), so refreshing the page
   all day doesn't spam duplicates.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from pymongo.database import Database
from sqlalchemy.orm import Session

from models.notification import Notification
from services import assessment_service, lifestyle_service, mongo_service, product_service, routine_service


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    type_: str,
    title: str,
    message: str,
    link_to: str | None = None,
    dedupe_key: str | None = None,
) -> Notification | None:
    """
    Create a notification. If `dedupe_key` is given and a notification with
    that exact key already exists for this user, do nothing — this is how
    contextual reminders avoid piling up every time the generator runs.
    """
    if dedupe_key:
        existing = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.dedupe_key == dedupe_key)
            .first()
        )
        if existing:
            return None

    notification = Notification(
        user_id=user_id, type=type_, title=title, message=message, link_to=link_to, dedupe_key=dedupe_key
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def list_notifications(db: Session, user_id: uuid.UUID, limit: int = 30) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def count_unread(db: Session, user_id: uuid.UUID) -> int:
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read.is_(False)).count()


def mark_read(db: Session, user_id: uuid.UUID, notification_id: uuid.UUID) -> Notification | None:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if notification is None:
        return None
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: uuid.UUID) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({"is_read": True})
    )
    db.commit()
    return updated


def generate_contextual_reminders(db: Session, mongo_db: Database, user_id: uuid.UUID) -> list[Notification]:
    """
    Checks the user's real current data and creates any reminders that
    apply right now. Safe to call on every dashboard load — dedupe_key
    means each kind of reminder fires at most once per day.
    """
    today_str = date.today().isoformat()
    created: list[Notification] = []

    # --- Routine reminder: any active steps not yet checked off today ---
    routine_steps = routine_service.get_active_routine(db, user_id)
    if routine_steps:
        today_log = mongo_service.get_log(mongo_db, user_id) if mongo_db is not None else None
        completed_ids = (
            {str(e["routine_step_id"]) for e in today_log.get("completed_steps", [])} if today_log else set()
        )
        daily_steps = [s for s in routine_steps if s.time_of_day in ("AM", "PM")]
        outstanding = [s for s in daily_steps if str(s.id) not in completed_ids]
        if daily_steps and outstanding:
            n = create_notification(
                db,
                user_id,
                "routine_reminder",
                "Routine steps waiting",
                f"You still have {len(outstanding)} routine step{'s' if len(outstanding) != 1 else ''} to check off today.",
                link_to="/planner",
                dedupe_key=f"routine:{user_id}:{today_str}",
            )
            if n:
                created.append(n)

    # --- Hydration + Sleep reminders: based on today's/most-recent lifestyle log ---
    logs = lifestyle_service.list_lifestyle_logs(db, user_id)
    latest_log = logs[0] if logs else None
    logged_today = latest_log and latest_log.logged_at.date() == date.today()

    if not logged_today:
        n = create_notification(
            db,
            user_id,
            "hydration_reminder",
            "Log today's hydration",
            "You haven't logged your water intake today — a quick log helps keep your Skin Health Score accurate.",
            link_to="/lifestyle",
            dedupe_key=f"hydration:{user_id}:{today_str}",
        )
        if n:
            created.append(n)
    elif latest_log.water_intake_liters is not None and latest_log.water_intake_liters < 1.5:
        n = create_notification(
            db,
            user_id,
            "hydration_reminder",
            "Drink more water",
            f"You've logged {latest_log.water_intake_liters}L today — try to reach at least 2L for better skin hydration.",
            link_to="/lifestyle",
            dedupe_key=f"hydration:{user_id}:{today_str}",
        )
        if n:
            created.append(n)

    if latest_log and latest_log.sleep_hours is not None and latest_log.sleep_hours < 6:
        n = create_notification(
            db,
            user_id,
            "sleep_reminder",
            "Low sleep logged",
            f"You logged {latest_log.sleep_hours}h of sleep — aim for 7-8h to support skin repair.",
            link_to="/lifestyle",
            dedupe_key=f"sleep:{user_id}:{today_str}",
        )
        if n:
            created.append(n)

    # --- Progress alert: declining score trend ---
    improvement = assessment_service.compute_improvement(db, user_id)
    if improvement and improvement["trend"] == "Declining":
        n = create_notification(
            db,
            user_id,
            "progress_alert",
            "Your Skin Health Score has dropped",
            f"Your score is down {abs(improvement['delta_points'])} points since your first assessment. "
            "Consider reviewing your routine or booking your consultant.",
            link_to="/progress",
            dedupe_key=f"progress_alert:{user_id}:{today_str}",
        )
        if n:
            created.append(n)

    # --- Product replenishment: orders placed 30+ days ago ---
    orders = product_service.list_orders_for_user(db, user_id)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    old_orders = [o for o in orders if o.created_at <= thirty_days_ago]
    if old_orders:
        most_recent_old = max(old_orders, key=lambda o: o.created_at)
        n = create_notification(
            db,
            user_id,
            "product_replenishment",
            "Time to restock?",
            "It's been over 30 days since your last order — if you're running low, consider reordering your products.",
            link_to="/store",
            dedupe_key=f"replenish:{user_id}:{today_str}",
        )
        if n:
            created.append(n)

    return created
