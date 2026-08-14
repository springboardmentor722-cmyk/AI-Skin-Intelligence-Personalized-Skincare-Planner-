from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os

from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ALLOWED_SELF_SIGNUP_ROLES = {"user", "consultant", "dermatologist"}
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    role = payload.role if payload.role in ALLOWED_SELF_SIGNUP_ROLES else "user"
    verification_status = "pending" if role in ("consultant", "dermatologist") else "not_applicable"

    user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=security.hash_password(payload.password),
        role=role,
        verification_status=verification_status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "user": user}


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "user": user}


class GoogleLoginRequest(BaseModel):
    id_token: str
    role: str = "user"  # only used the first time this Google account signs up


@router.post("/google", response_model=schemas.Token)
def login_with_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    OAuth2 / OpenID Connect login via Google.

    Flow: the frontend uses Google Identity Services (google-accounts GSI JS
    library) to get a signed ID token in the browser, then POSTs it here.
    We verify the token's signature and audience against our Google Client ID,
    then create or look up the matching user and issue our own JWT exactly
    like the email/password flow, so the rest of the app doesn't need to know
    which login method was used.

    Requires the GOOGLE_CLIENT_ID environment variable to be set to the
    OAuth 2.0 Client ID created in Google Cloud Console (see README).
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google login is not configured on this server. Set GOOGLE_CLIENT_ID in the backend environment.",
        )

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Google ID token.")

    email = idinfo.get("email")
    name = idinfo.get("name") or email.split("@")[0]
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        role = payload.role if payload.role in ALLOWED_SELF_SIGNUP_ROLES else "user"
        verification_status = "pending" if role in ("consultant", "dermatologist") else "not_applicable"
        # Google-authenticated users don't have a local password; store an
        # unusable hash so the email/password login path can never succeed for them.
        user = models.User(
            name=name,
            email=email,
            hashed_password=security.hash_password(os.urandom(24).hex()),
            role=role,
            verification_status=verification_status,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "user": user}
