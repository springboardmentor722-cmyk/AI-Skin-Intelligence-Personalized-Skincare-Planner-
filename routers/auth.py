"""Authentication routes: register, login, logout, current-user info."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from controllers import auth_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from schemas.user import UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new account for any of the four supported roles."""
    return auth_controller.register_user(db, payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and issue a JWT access token."""
    return auth_controller.login_user(db, payload)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """
    Stateless JWT logout.

    The frontend simply discards the token. This endpoint exists for a
    consistent API surface and future server-side session revocation.
    """
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
