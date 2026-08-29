from datetime import datetime, timedelta

from jose import jwt

from services.auth_service.app.core.config import settings


def create_access_token(data: dict):
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_reset_token(email: str):
    # Short-lived, single-purpose token — separate from login tokens so a
    # leaked reset link can't be used as a general auth token.
    payload = {"sub": email, "purpose": "password_reset"}
    expire = datetime.utcnow() + timedelta(minutes=15)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])