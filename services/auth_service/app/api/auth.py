from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from services.auth_service.app.schemas.user import (
    UserCreate, UserOut, UserBasic,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from services.auth_service.app.db.dependencies import get_db
from services.auth_service.app.business.auth_service import (
    register_user, login_user, get_all_users, get_users_by_role,
    forgot_password, reset_password,
)
from fastapi.security import OAuth2PasswordRequestForm
from services.auth_service.app.utils.dependencies import get_current_user
from services.auth_service.app.utils.roles import require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Only these roles can be listed via the picker endpoint below —
# keeps it from becoming a general-purpose "list all users" leak.
PICKABLE_ROLES = {"consultant", "dermatologist"}


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(user, db)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login_user(form_data, db)


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/admin")
def admin_dashboard(current_user=Depends(require_role("admin"))):
    return {"message": "Welcome Admin"}


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    return get_all_users(db)


@router.get("/users/by-role/{role}", response_model=List[UserBasic])
def list_users_by_role(
    role: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if role not in PICKABLE_ROLES:
        raise HTTPException(status_code=400, detail="This role can't be listed here")
    return get_users_by_role(role, db)


@router.post("/forgot-password")
def forgot(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password(payload.email, db)


@router.post("/reset-password")
def reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_password(payload.token, payload.new_password, db)