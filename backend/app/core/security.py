"""Validate, never authenticate — Better Auth is the auth authority (ADR-002/003).
Source: database_schemas/skinlytics_identity_betterauth.md.
"""

from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import settings
from app.db.redis import get_redis

bearer = HTTPBearer(auto_error=True)


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
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}") from exc


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
