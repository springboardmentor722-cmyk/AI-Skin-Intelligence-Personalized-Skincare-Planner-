"""Auth controller — orchestrates request validation, services, and responses."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.security import create_access_token
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from services import auth_service
from utils.helpers import record_audit_log
from utils.validators import is_valid_phone, is_valid_role


def register_user(db: Session, payload: RegisterRequest) -> TokenResponse:
    if not is_valid_role(payload.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role selected")

    if not is_valid_phone(payload.phone_number):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid phone number")

    if auth_service.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = auth_service.create_user(db, payload)
    record_audit_log(db, user.id, "REGISTER", f"New {payload.role} account created")

    token = create_access_token({"sub": str(user.id), "role": user.role.name})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
    )


def login_user(db: Session, payload: LoginRequest) -> TokenResponse:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    record_audit_log(db, user.id, "LOGIN", "User logged in")

    token = create_access_token(
        {"sub": str(user.id), "role": user.role.name}, remember_me=payload.remember_me
    )
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
    )
