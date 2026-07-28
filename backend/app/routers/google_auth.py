"""Google Sign-In.

The browser runs Google Identity Services and receives a signed ID token (JWT).
It posts that token here; we verify the signature against Google's public keys,
confirm it was issued for our client ID, then either link it to an existing
account (matched by verified email) or create a new patient account — and hand
back the same Lumen access token the email/password flow issues, so everything
downstream (RBAC, dashboards, sessions) works identically.

Configure GOOGLE_CLIENT_ID in .env to enable. When unset, /auth/google/config
reports enabled=false and the frontend hides the button.
"""
import json
import secrets
import urllib.request
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jwt import PyJWKClient
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import audit
from ..models import Role, SkinProfile, User
from ..schemas import TokenOut, UserOut
from ..security import create_access_token, hash_password

router = APIRouter(prefix="/auth/google", tags=["auth"])
settings = get_settings()

GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}
GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs"

_jwk_client: PyJWKClient | None = None


def _jwks() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(GOOGLE_JWKS_URI, cache_keys=True)
    return _jwk_client


class GoogleCredentialIn(BaseModel):
    credential: str  # the ID token returned by Google Identity Services


@router.get("/config")
def google_config():
    """Frontend asks whether Google Sign-In is configured before showing the button."""
    return {
        "enabled": bool(settings.google_client_id),
        "client_id": settings.google_client_id or None,
    }


@router.post("", response_model=TokenOut)
def google_login(body: GoogleCredentialIn, request: Request, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Google Sign-In is not configured on this server. Set GOOGLE_CLIENT_ID in .env.",
        )

    # 1. Verify the ID token: signature, audience, issuer, expiry.
    try:
        signing_key = _jwks().get_signing_key_from_jwt(body.credential)
        claims = jwt.decode(
            body.credential,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.google_client_id,
            options={"require": ["exp", "iat", "aud", "iss", "sub"]},
        )
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid Google token: {exc}")

    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unrecognized token issuer")
    if not claims.get("email_verified"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your Google email address is not verified")

    email = (claims.get("email") or "").lower()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google did not return an email address")
    full_name = claims.get("name") or email.split("@")[0]

    # 2. Link to an existing account, or provision a new patient account.
    user = db.scalar(select(User).where(User.email == email))
    created = False
    if user is None:
        user = User(
            email=email,
            # Random unusable password: this account signs in through Google.
            # They can still be given a password later by an administrator.
            password_hash=hash_password(secrets.token_urlsafe(32)),
            full_name=full_name,
            role=Role.USER,
            is_verified=True,
        )
        db.add(user)
        db.flush()
        db.add(SkinProfile(user_id=user.id))
        created = True

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is suspended")

    audit(db, request, user, "auth.google_login", "user", user.id,
          new_value={"email": email, "new_account": created})
    db.commit()
    db.refresh(user)

    # 3. Issue the same Lumen token the password flow issues.
    return TokenOut(
        access_token=create_access_token(user.id, user.role),
        user=UserOut.model_validate(user),
    )
