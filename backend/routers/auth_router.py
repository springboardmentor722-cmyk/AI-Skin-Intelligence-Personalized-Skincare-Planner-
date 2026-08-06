from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime
from jose import jwt

from database import SessionLocal
from models import User
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM
)
from schemas import (
    UserCreate,
    UserResponse,
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse
)

router = APIRouter(tags=["Authentication"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Input validation
    clean_email = user.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Invalid email address", "field": "email"}
        )

    if not user.password or len(user.password) < 6:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Password must be at least 6 characters", "field": "password"}
        )

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Email already registered", "field": "email"}
        )

    # Set inactive for specialists until admin approves
    valid_roles = ["user", "consultant", "dermatologist", "admin"]
    user_role = user.role.lower() if user.role and user.role.lower() in valid_roles else "user"
    is_active = user_role not in ["consultant", "dermatologist"]

    new_user = User(
        name=user.name.strip() if user.name else "User",
        email=clean_email,
        password=hash_password(user.password),
        role=user_role,
        is_active=is_active,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
async def login_user(request: Request, db: Session = Depends(get_db)):
    email = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": "Invalid JSON payload"}
            )
    else:
        try:
            form = await request.form()
            email = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": "Invalid form data"}
            )

    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Email and password are required", "field": "email"}
        )

    clean_email = email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()

    if not existing_user:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "User not found with this email", "field": "email"}
        )

    if not verify_password(password, existing_user.password):
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Invalid password", "field": "password"}
        )

    if not existing_user.is_active:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Your account is pending admin approval.", "field": "account"}
        )

    from utils import get_display_name

    display_name = get_display_name(existing_user)

    access_token = create_access_token({
        "id": existing_user.id,
        "email": existing_user.email,
        "role": existing_user.role,
        "name": display_name,
        "full_name": display_name,
    })
    refresh_token = create_refresh_token({
        "id": existing_user.id,
        "email": existing_user.email,
        "role": existing_user.role,
        "name": display_name,
        "full_name": display_name,
    })

    next_page = "/dashboard"
    if existing_user.role == "user" and not existing_user.profile_completed:
        next_page = "/skin-profile"
    elif existing_user.role == "consultant":
        next_page = "/consultant-dashboard"
    elif existing_user.role == "dermatologist":
        next_page = "/dermatologist-dashboard"
    elif existing_user.role == "admin":
        next_page = "/admin-dashboard"

    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "profile_completed": existing_user.profile_completed,
        "next_page": next_page,
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "role": existing_user.role,
            "is_active": existing_user.is_active,
            "profile_completed": existing_user.profile_completed,
            "created_at": existing_user.created_at,
        },
    }


@router.post("/refresh-token", response_model=TokenRefreshResponse)
def refresh_token_endpoint(req: TokenRefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=401,
                detail={"success": False, "message": "Invalid refresh token"}
            )

        user_id = payload.get("id")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=401,
                detail={"success": False, "message": "User not found or inactive"}
            )

        new_access_token = create_access_token({
            "id": user.id,
            "email": user.email,
            "role": user.role,
        })
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except Exception:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "message": "Invalid or expired refresh token"}
        )


@router.post("/logout")
def logout_user():
    return {"success": True, "message": "Logged out successfully"}
