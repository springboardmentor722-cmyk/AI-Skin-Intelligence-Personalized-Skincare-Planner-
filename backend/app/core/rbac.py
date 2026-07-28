# app/core/rbac.py
"""
Reusable FastAPI dependencies for role + approval-status gated routes.

Usage in any router:

    from app.core.rbac import require_role, require_approved
    from app.models.user import UserRole

    @router.get("/consultant-only-thing")
    def do_thing(user: User = Depends(require_role(UserRole.CONSULTANT))):
        ...

require_role() already implies "must be logged in" (it depends on get_current_user).
require_approved() additionally blocks PENDING / REJECTED / SUSPENDED accounts —
use it on any consultant/dermatologist route that shouldn't be reachable pre-approval.
"""
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user  # your existing JWT-decode dependency
from app.models.user import User, UserRole, UserStatus


def require_role(*allowed_roles: UserRole):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires one of these roles: {[r.value for r in allowed_roles]}",
            )
        return user

    return dependency


def require_approved(*allowed_roles: UserRole):
    """
    Combines a role check with an approval-status check.
    Users are always APPROVED at registration, so this is mainly for
    Consultant / Dermatologist routes.
    """
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires one of these roles: {[r.value for r in allowed_roles]}",
            )
        if user.status == UserStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is still pending admin approval.",
            )
        if user.status == UserStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your application was rejected. Contact support for details.",
            )
        if user.status == UserStatus.SUSPENDED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended.",
            )
        return user

    return dependency


def require_admin():
    return require_role(UserRole.ADMIN)