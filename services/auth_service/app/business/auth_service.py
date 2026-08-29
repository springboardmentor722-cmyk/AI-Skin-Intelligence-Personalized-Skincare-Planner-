from sqlalchemy.orm import Session
from fastapi import HTTPException
from jose import JWTError

from services.auth_service.app.models.user import User
from services.auth_service.app.schemas.user import UserCreate
from services.auth_service.app.utils.security import hash_password, verify_password
from fastapi.security import OAuth2PasswordRequestForm
from services.auth_service.app.utils.jwt import (
    create_access_token,
    create_reset_token,
    decode_token,
)


def register_user(user: UserCreate, db: Session):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "role": new_user.role}


def login_user(form_data: OAuth2PasswordRequestForm, db: Session):
    existing_user = db.query(User).filter(User.email == form_data.username).first()
    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid Email or Password")
    if not verify_password(form_data.password, existing_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Email or Password")

    token = create_access_token({
        "id": existing_user.id,
        "sub": existing_user.email,
        "role": existing_user.role,
    })
    return {"access_token": token, "token_type": "bearer", "role": existing_user.role}


def get_all_users(db: Session):
    return db.query(User).order_by(User.created_at.desc()).all()


def get_users_by_role(role: str, db: Session):
    return db.query(User).filter(User.role == role).order_by(User.full_name).all()


def forgot_password(email: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "If that email is registered, a reset link has been generated."}

    token = create_reset_token(user.email)
    return {
        "message": "If that email is registered, a reset link has been generated.",
        "dev_reset_token": token,
    }


def reset_password(token: str, new_password: str, db: Session):
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password reset successfully"}