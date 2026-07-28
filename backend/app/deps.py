"""FastAPI dependencies: authentication, RBAC enforcement, audit logging."""
import json

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import AuditLog, Notification, User
from .permissions import role_has
from .security import decode_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(creds.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or suspended")
    return user


def require(permission: str):
    """Route dependency: the caller's role must hold `permission`."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if not role_has(user.role, permission):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Missing permission: {permission}")
        return user

    return checker


def audit(
    db: Session,
    request: Request | None,
    actor: User | None,
    action: str,
    entity: str = "",
    entity_id: str | int | None = None,
    old_value=None,
    new_value=None,
    log_status: str = "success",
) -> None:
    db.add(AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else None,
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        old_value=json.dumps(old_value, default=str) if old_value is not None else None,
        new_value=json.dumps(new_value, default=str) if new_value is not None else None,
        ip=request.client.host if request and request.client else None,
        status=log_status,
    ))


def notify(db: Session, user_id: int, title: str, body: str = "", kind: str = "info") -> None:
    db.add(Notification(user_id=user_id, title=title, body=body, kind=kind))
