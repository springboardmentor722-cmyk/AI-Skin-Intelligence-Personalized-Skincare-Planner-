"""
Security utilities: password hashing and JWT token creation/validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ----------------------------------------------------------------------
# Password hashing
# ----------------------------------------------------------------------
def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ----------------------------------------------------------------------
# JWT tokens
# ----------------------------------------------------------------------
def create_access_token(data: dict, remember_me: bool = False) -> str:
    """
    Create a signed JWT access token.

    If `remember_me` is True, the token lives much longer
    (REMEMBER_ME_EXPIRE_DAYS) than the default session token.
    """
    to_encode = data.copy()

    if remember_me:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token. Returns None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
