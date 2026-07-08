from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import RequestIdMiddleware, configure_logging
from app.services.progress.router import router as progress_router
from app.services.recommendations.router import router as recommendations_router
from app.services.routines.router import router as routines_router
from app.services.scores.router import router as scores_router
from app.services.skin_profile.router import lifestyle_router
from app.services.skin_profile.router import router as skin_profile_router
from app.services.user.router import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    configure_logging(settings.environment)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Skinlytics API", version="0.1.0", lifespan=lifespan)

    # Gateway concerns (docs/ARCHITECTURE.md §3): request-id -> CORS -> rate limit
    # (lands with the Authentication task, Redis is already wired) -> JWT verify
    # (per-route, app.core.security) -> validation (per-route Pydantic schemas).
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.better_auth_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    # Health check is intentionally outside /api/v1 (ADR-009 versions business routes;
    # infra liveness/readiness probes are conventionally unversioned).
    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    api_v1 = APIRouter(prefix="/api/v1")
    api_v1.include_router(user_router, prefix="/users", tags=["users"])
    # skin_profile_router/lifestyle_router already define full paths (/skin-profiles,
    # /skin-types, /skin-concerns, /lifestyle-logs) — one service, two resource kinds,
    # two API prefixes per docs/ARCHITECTURE.md §4, so no extra prefix here.
    api_v1.include_router(skin_profile_router, tags=["skin-profiles"])
    api_v1.include_router(lifestyle_router, tags=["lifestyle-logs"])
    api_v1.include_router(scores_router, tags=["scores"])
    api_v1.include_router(routines_router, tags=["routines"])
    api_v1.include_router(recommendations_router, tags=["recommendations"])
    api_v1.include_router(progress_router, tags=["progress"])
    app.include_router(api_v1)

    return app


app = create_app()
