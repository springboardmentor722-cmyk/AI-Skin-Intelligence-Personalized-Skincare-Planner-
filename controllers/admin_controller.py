"""Admin controller — platform-wide user/role management and statistics."""

from sqlalchemy.orm import Session

from models.audit import AuditLog
from models.role import Role
from models.user import User


def list_all_users(db: Session) -> list[User]:
    return db.query(User).filter(User.is_deleted.is_(False)).order_by(User.created_at.desc()).all()


def get_platform_statistics(db: Session) -> dict:
    total_users = db.query(User).filter(User.is_deleted.is_(False)).count()
    per_role = {}
    for role in db.query(Role).all():
        per_role[role.name] = (
            db.query(User)
            .filter(User.role_id == role.id, User.is_deleted.is_(False))
            .count()
        )
    return {
        "total_users": total_users,
        "users_per_role": per_role,
        "active_users": db.query(User).filter(User.is_active.is_(True), User.is_deleted.is_(False)).count(),
    }


def get_recent_activity(db: Session, limit: int = 20) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()


def set_user_active_status(db: Session, user: User, is_active: bool) -> User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
