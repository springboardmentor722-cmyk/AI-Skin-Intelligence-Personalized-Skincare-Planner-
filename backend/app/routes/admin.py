from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, RoleUpdate
from app.role_dependencies import require_role
from app.models import Appointment, Notification , RoleRequest

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# Get all users
@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users = db.query(User).all()
    return users


# Change user role
@router.put("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    allowed_roles = [
        "user",
        "consultant",
        "dermatologist",
        "admin"
    ]

    if role_data.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user.role = role_data.role

    db.commit()
    db.refresh(user)

    return user


# Delete user
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    # Prevent admin from deleting themselves
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account."
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
     raise HTTPException(
        status_code=404,
        detail="User not found",
    )

# Remove consultant references
    appointments = db.query(Appointment).filter(
    Appointment.consultant_id == user_id
).all()

    for appointment in appointments:
     appointment.consultant_id = None

# Remove dermatologist references
    appointments = db.query(Appointment).filter(
     Appointment.dermatologist_id == user_id
).all()

    for appointment in appointments:
     appointment.dermatologist_id = None

# Delete notifications
    db.query(Notification).filter(
    Notification.user_id == user_id
).delete()

    db.query(Notification).filter(
    Notification.consultant_id == user_id
).delete()

    db.query(Notification).filter(
    Notification.dermatologist_id == user_id
).delete()

    db.commit()

    # Delete role requests of this user
    db.query(RoleRequest).filter(
    RoleRequest.user_id == user_id
).delete()

    db.commit()

    db.delete(user)
    db.commit()

    return {
    "message": "User deleted successfully."
}