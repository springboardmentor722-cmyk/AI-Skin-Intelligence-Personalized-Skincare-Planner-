"""One error envelope everywhere (docs/CONVENTIONS.md): { "error": { "code",
"message", "details", "request_id" } }. Codes are stable snake_case strings."""

import structlog
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = structlog.get_logger()

_STATUS_CODE_NAMES = {
    status.HTTP_400_BAD_REQUEST: "bad_request",
    status.HTTP_401_UNAUTHORIZED: "unauthenticated",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_409_CONFLICT: "conflict",
    status.HTTP_422_UNPROCESSABLE_CONTENT: "validation_error",
    status.HTTP_429_TOO_MANY_REQUESTS: "rate_limited",
}


def _envelope(
    request: Request, code: str, message: str, details: list[object] | None = None
) -> dict[str, object]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
            "request_id": getattr(request.state, "request_id", ""),
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    # Registered on the Starlette base class, not fastapi.HTTPException, so this also
    # catches routing-level exceptions Starlette raises itself (404 no-route, 405
    # wrong-method) — those are never fastapi.HTTPException instances.
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code = _STATUS_CODE_NAMES.get(exc.status_code, "error")
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(request, code, str(exc.detail)),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=_envelope(
                request,
                "validation_error",
                "Request validation failed",
                jsonable_encoder(exc.errors()),
            ),
        )

    # Catch-all — without this, an unexpected exception (e.g. Mongo unreachable) falls
    # through to Starlette's default plain-text 500, bypassing the envelope entirely.
    # Found by actually triggering one (Mongo down) while testing, not by inspection.
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_exception", error=str(exc), exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope(request, "internal_error", "Something went wrong"),
        )
