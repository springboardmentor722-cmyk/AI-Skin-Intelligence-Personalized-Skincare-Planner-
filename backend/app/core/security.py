"""Validate, never authenticate — Better Auth is the auth authority (ADR-002/003).
Source: database_schemas/skinlytics_identity_betterauth.md.
"""

from functools import lru_cache
from typing import Any

import jwt
import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.postgres import get_db
from app.db.redis import get_redis
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile

bearer = HTTPBearer(auto_error=True)
logger = structlog.get_logger()

# Auth/ownership dependencies live centrally here (docs/CONVENTIONS.md), including this
# one even though it reaches into two services' models — `require_verified_professional`
# is itself an auth primitive (gating on JWT role *and* live verification status), not
# domain logic, so it belongs next to `require_role`, not duplicated into each service's
# own (nonexistent, per convention) deps.py.
_VERIFIED_PROFILE_MODEL: dict[str, type[ConsultantProfile] | type[DermatologistProfile]] = {
    "consultant": ConsultantProfile,
    "dermatologist": DermatologistProfile,
}


@lru_cache(maxsize=1)
def _jwk_client() -> PyJWKClient:
    # JWKS rarely changes; cache the client. PyJWKClient itself refetches on an
    # unknown `kid` (key rotation) — see the identity doc's "Gotchas".
    return PyJWKClient(f"{settings.better_auth_url}/api/auth/jwks")


def _decode(token: str) -> dict[str, Any]:
    try:
        signing_key = _jwk_client().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            signing_key,
            algorithms=["EdDSA", "RS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={"require": ["exp", "iss", "aud"]},
        )
    except jwt.PyJWTError as exc:
        # Log the real cause server-side; never echo raw library exception text back to
        # the client (it can leak internals — e.g. decode/codec errors).
        logger.warning("jwt_validation_failed", error=str(exc))
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc


async def require_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict[str, Any]:
    claims = _decode(cred.credentials)

    jti = claims.get("jti")
    if jti and await get_redis().exists(f"auth:blacklist:{jti}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has been revoked")

    return {"id": claims["sub"], "role": claims.get("role", "user"), "claims": claims}


def require_role(*allowed: str):  # type: ignore[no-untyped-def]
    async def _dep(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
        if user["role"] not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return user

    return _dep


def require_verified_professional(*roles: str):  # type: ignore[no-untyped-def]
    """Gates *operational* consultant/dermatologist endpoints (M2+) on the matching
    profile's `verification_status == "approved"` — never used on the profile's own
    management endpoints (view/edit/upload-documents), which must stay reachable in
    every status so a pending/rejected professional can still act on their own
    verification (Branch 4/5's onboarding plan)."""

    async def _dep(
        user: dict[str, Any] = Depends(require_role(*roles)),
        db: AsyncSession = Depends(get_db),
    ) -> dict[str, Any]:
        model = _VERIFIED_PROFILE_MODEL.get(user["role"])
        if model is None:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No professional profile for this role")
        result = await db.execute(
            select(model.verification_status).where(model.user_id == user["id"])
        )
        verification_status = result.scalar_one_or_none()
        if verification_status != "approved":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Professional account not yet verified")
        return user

    return _dep
