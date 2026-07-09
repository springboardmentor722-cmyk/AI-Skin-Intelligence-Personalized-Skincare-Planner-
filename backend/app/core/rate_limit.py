"""Gateway-level rate limiting (docs/ARCHITECTURE.md §9, §6 "per-tier rate limits").

Milestone 1 audit finding: `app/main.py` reserved a spot for this ("lands with the
Authentication task, Redis is already wired") and `app/core/errors.py` already maps
429 to the `rate_limited` error code, but nothing ever raised one — the whole API was
unthrottled. Redis-backed fixed-window counter, one ceiling per identity: the JWT
`sub` claim if a bearer token is present (unverified read only — this middleware runs
before `core/security.py`'s real signature/JWKS check, so it must not trust the claim
for anything beyond bucketing; a forged token just gets its own bucket, it doesn't
escape limiting), else the client IP for anonymous requests. Not yet split into the
doc's finer per-endpoint "stricter on AI paths" tier — no AI path does real (expensive)
work yet, every one is a cheap deterministic ADR-007 stub computation, so one general
ceiling is the honest scope for now.
"""

import json
import time

import jwt
import structlog
from starlette.requests import Request
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.config import settings
from app.core.errors import error_envelope
from app.db.redis import get_redis

logger = structlog.get_logger()

_WINDOW_SECONDS = 60


def _identity(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:]
        try:
            # Unverified on purpose — see module docstring. Only used to bucket a
            # forged/expired/tampered token separately from anonymous traffic; the
            # real signature check happens downstream in core/security.py.
            claims = jwt.decode(token, options={"verify_signature": False})
            sub = claims.get("sub")
            if sub:
                return f"user:{sub}"
        except jwt.PyJWTError:
            pass
    client = request.client
    return f"ip:{client.host if client else 'unknown'}"


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] == "/health":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        identity = _identity(request)
        key = f"ratelimit:{identity}:{int(time.time() // _WINDOW_SECONDS)}"

        redis = get_redis()
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, _WINDOW_SECONDS)

        if count > settings.rate_limit_per_minute:
            logger.warning("rate_limited", identity=identity, count=count)
            # error_envelope reads request.state.request_id via getattr — Starlette's
            # Request.state proxies scope["state"], already set by RequestIdMiddleware
            # (which must run before this one — see app/main.py's ordering comment).
            body = error_envelope(
                request,
                "rate_limited",
                "Too many requests. Please slow down and try again shortly.",
            )
            payload = json.dumps(body).encode()
            await send(
                {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"retry-after", str(_WINDOW_SECONDS).encode()),
                    ],
                }
            )
            await send({"type": "http.response.body", "body": payload})
            return

        await self.app(scope, receive, send)
