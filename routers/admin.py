"""Administrator-only routes: user management, role management, platform stats."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import admin_controller
from core.database import get_db
from core.dependencies import require_role
from models.user import User
from schemas.user import UserListItem
from utils.constants import ROLE_ADMINISTRATOR

router = APIRouter(
    prefix="/api/admin",
    tags=["Administrator"],
    dependencies=[Depends(require_role(ROLE_ADMINISTRATOR))],
)


@router.get("/users", response_model=list[UserListItem])
def list_users(db: Session = Depends(get_db)):
    users = admin_controller.list_all_users(db)
    return [UserListItem.model_validate(u) for u in users]


@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db)):
    return admin_controller.get_platform_statistics(db)


@router.get("/activity-logs")
def activity_logs(db: Session = Depends(get_db)):
    logs = admin_controller.get_recent_activity(db)
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/recommendations")
def recommendation_monitoring(db: Session = Depends(get_db)):
    """Admin visibility into what consultants are recommending, platform-wide, plus a real conversion rate."""
    return admin_controller.get_recommendation_monitoring(db)


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: uuid.UUID,
    is_active: bool,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"message": "User not found"}
    admin_controller.set_user_active_status(db, user, is_active)
    return {"message": "User status updated", "is_active": is_active}


@router.get("/system-status")
def system_status():
    """Placeholder system health/status endpoint for the Admin dashboard."""
    return {
        "api": "online",
        "database": "connected",
        "ai_modules": "coming_soon",
    }
