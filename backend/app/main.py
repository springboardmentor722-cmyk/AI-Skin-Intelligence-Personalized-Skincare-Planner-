import asyncio
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import RequestIdMiddleware, configure_logging
from app.core.rate_limit import RateLimitMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.db.mongo import get_mongo_db
from app.db.postgres import engine
from app.db.redis import get_redis
from app.services.admin.router import router as admin_router
from app.services.analytics.router import router as analytics_router
from app.services.assessment.router import router as assessment_router
from app.services.clinical_review.router import router as clinical_review_router
from app.services.consultant_profile.router import router as consultant_profile_router
from app.services.dermatologist_profile.router import router as dermatologist_profile_router
from app.services.ingredients.router import router as ingredients_router
from app.services.instrumentation.router import router as instrumentation_router
from app.services.progress.router import router as progress_router
from app.services.recommendations.products_router import router as products_router
from app.services.recommendations.router import router as recommendations_router
from app.services.routines.router import router as routines_router
from app.services.scores.router import router as scores_router
from app.services.skin_profile.router import lifestyle_router
from app.services.skin_profile.router import router as skin_profile_router
from app.services.user.router import router as user_router
from app.services.weather.router import router as weather_router


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    configure_logging(settings.environment)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Skinlytics API", version="0.1.0", lifespan=lifespan)

    # Gateway concerns (docs/ARCHITECTURE.md §3): SecurityHeaders -> CORS ->
    # request-id -> rate limit -> JWT verify (per-route, app.core.security) ->
    # validation (per-route Pydantic schemas). Starlette's add_middleware() inserts
    # each call at the *front* of the stack (starlette/applications.py), so the
    # most-recently-added middleware runs first — added here in reverse of that
    # execution order (RateLimit first, ..., SecurityHeaders last) so CORS preflight
    # (OPTIONS) is handled before rate limiting counts it, RequestIdMiddleware has
    # already set request_id before RateLimitMiddleware needs it for a 429's error
    # envelope, and SecurityHeaders — outermost, added last — wraps every possible
    # response path (including a CORS preflight or a rate-limit 429) so nothing can
    # leave this API missing its security headers. Milestone 1 audit: rate limiting
    # was a reserved comment ("lands with the Authentication task") with nothing
    # actually wired — Redis was sitting there unused for this. Production-readiness
    # audit: the browser hits this API directly (`web/lib/api.ts`'s
    # `NEXT_PUBLIC_API_URL`, not proxied through Next.js), so it never had any of the
    # security headers `web/next.config.ts` already sets on the frontend's own
    # responses — SecurityHeadersMiddleware closes that gap with the same values.
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.better_auth_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)

    register_exception_handlers(app)

    # Health check is intentionally outside /api/v1 (ADR-009 versions business routes;
    # infra liveness/readiness probes are conventionally unversioned).
    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # Production-readiness audit finding: /health always returned 200 regardless of
    # whether Postgres/Redis/Mongo were actually reachable — useless as an
    # orchestrator (k8s/ECS) signal to route traffic away from an instance that
    # can't really serve requests. Standard split: /health stays a fast, unconditional
    # liveness probe (unchanged above — "is the process alive", not "can it serve
    # traffic"); /health/ready does the real work. Each check gets its own short
    # timeout so one hung dependency can't make the readiness probe itself hang
    # indefinitely (which would be worse than a fast, honest 503).
    @app.get("/health/ready")
    async def health_ready() -> JSONResponse:
        checks: dict[str, str] = {}

        async def _check_postgres() -> None:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

        async def _check_redis() -> None:
            await get_redis().ping()

        async def _check_mongo() -> None:
            await get_mongo_db().command("ping")

        for name, check in (
            ("postgres", _check_postgres),
            ("redis", _check_redis),
            ("mongo", _check_mongo),
        ):
            try:
                # Intentionally broad — for a readiness probe, any failure from a
                # dependency (connection refused, timeout, auth error, ...) means
                # the same thing: not ready. Never raises past this point.
                await asyncio.wait_for(check(), timeout=3.0)
                checks[name] = "ok"
            except Exception as exc:
                checks[name] = f"error: {exc.__class__.__name__}"

        healthy = all(status == "ok" for status in checks.values())
        return JSONResponse(
            status_code=200 if healthy else 503,
            content={"status": "ok" if healthy else "degraded", "checks": checks},
        )

    api_v1 = APIRouter(prefix="/api/v1")
    api_v1.include_router(user_router, prefix="/users", tags=["users"])
    # skin_profile_router/lifestyle_router already define full paths (/skin-profiles,
    # /skin-types, /skin-concerns, /lifestyle-logs) — one service, two resource kinds,
    # two API prefixes per docs/ARCHITECTURE.md §4, so no extra prefix here.
    api_v1.include_router(skin_profile_router, tags=["skin-profiles"])
    api_v1.include_router(lifestyle_router, tags=["lifestyle-logs"])
    api_v1.include_router(scores_router, tags=["scores"])
    api_v1.include_router(assessment_router, tags=["assessment"])
    api_v1.include_router(routines_router, tags=["routines"])
    api_v1.include_router(recommendations_router, tags=["recommendations"])
    # products_router (M3-C) already declares full paths (/products, /products/{id},
    # /products/compare, /products/{id}/alternatives) — owned by the Product
    # Recommendation service alongside recommendations_router (same products* tables).
    api_v1.include_router(products_router, tags=["products"])
    # ingredients_router already declares full paths (/ingredients, /ingredients/{id},
    # /ingredients/{id}/suitability/me, /ingredients/interactions), M3-B.
    api_v1.include_router(ingredients_router, tags=["ingredients"])
    api_v1.include_router(progress_router, tags=["progress"])
    api_v1.include_router(analytics_router, tags=["analytics"])
    api_v1.include_router(instrumentation_router, tags=["instrumentation"])
    # admin_router already declares prefix="/admin" (verification queue + audit logs).
    api_v1.include_router(admin_router, tags=["admin"])
    # consultant_profile_router already declares prefix="/consultant-profiles".
    api_v1.include_router(consultant_profile_router, tags=["consultant-profiles"])
    # dermatologist_profile_router already declares prefix="/dermatologist-profiles".
    api_v1.include_router(dermatologist_profile_router, tags=["dermatologist-profiles"])
    # Consultant/Dermatologist clinical review — shared by both roles (docs/
    # ARCHITECTURE.md §2's role table), not consultant-only despite consultant_
    # -prefixed table names.
    api_v1.include_router(clinical_review_router, tags=["clinical-review"])
    # Real OpenWeather/OpenUV adapters (docs/DATASETS_AND_APIS.md) behind the
    # topbar's existing "UV —" stub chip.
    api_v1.include_router(weather_router, tags=["weather"])
    app.include_router(api_v1)

    return app


app = create_app()
