import logging
import time
import uuid

import structlog
from starlette.requests import Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.metrics import record_latency

REQUEST_ID_HEADER = "X-Request-ID"


def configure_logging(environment: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
            if environment == "production"
            else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


class RequestIdMiddleware:
    """Assigns a request_id, binds it to structlog context, echoes it on the response
    (CONVENTIONS.md: request_id propagated frontend -> gateway -> services -> worker).
    Also times every request (M3-G, ARCHITECTURE.md §9's "API response time, rec
    latency ... surfaced in the Admin monitoring screen") — one real, structured
    `request_completed` log line plus a rolling sample in app/core/metrics.py, in
    this existing middleware slot rather than a new layer (the gateway's stack
    order is deliberate, main.py's own comment)."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())

        # Stash on scope["state"] (Starlette's Request.state) so anything holding this
        # request downstream — route handlers, exception handlers — can read the
        # resolved id even when the caller didn't send one themselves.
        scope.setdefault("state", {})["request_id"] = request_id

        status_code = 500

        async def send_with_header(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = message.setdefault("headers", [])
                headers.append((REQUEST_ID_HEADER.encode(), request_id.encode()))
            await send(message)

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        started_at = time.monotonic()
        try:
            await self.app(scope, receive, send_with_header)
        finally:
            duration_ms = (time.monotonic() - started_at) * 1000
            structlog.get_logger().info(
                "request_completed",
                method=scope["method"],
                path=scope["path"],
                status_code=status_code,
                duration_ms=round(duration_ms, 1),
            )
            # record_latency degrades gracefully on its own (app/core/metrics.py) —
            # a Redis outage here never crashes the response.
            await record_latency("api", duration_ms)
            if scope["path"].startswith("/api/v1/recommendations"):
                await record_latency("recommendations", duration_ms)


# Kept for callers that want a typed dependency instead of reading request.state.
async def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")
