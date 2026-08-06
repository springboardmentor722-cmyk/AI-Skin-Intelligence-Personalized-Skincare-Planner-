from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from auth import SECRET_KEY, ALGORITHM
from database import SessionLocal
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required"
        )
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id: int = payload.get("id")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account pending admin approval or inactive"
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def get_current_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    return current_user


def role_required(allowed_roles: list):
    def checker(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)):
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Authentication token required"
            )
        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            role = payload.get("role")
            user_id = payload.get("id")

            if not user_id or role not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail="Permission Denied"
                )

            # Check active status from DB
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=403,
                    detail="Account is inactive or pending approval"
                )

            return payload

        except JWTError:
            raise HTTPException(
                status_code=401,
                detail="Invalid Token"
            )

    return checker