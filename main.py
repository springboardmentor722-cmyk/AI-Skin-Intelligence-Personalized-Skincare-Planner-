"""
Application entry point.

Running `python main.py` will:
  1. Initialize the FastAPI app
  2. Connect to PostgreSQL and create tables if they do not exist
  3. Register middleware (CORS, exception handling)
  4. Register every router
  5. Serve the React production build (frontend/dist)
  6. Launch Uvicorn and open the browser automatically

This file is intentionally lightweight — all business logic lives in
routers/controllers/services. main.py only wires things together.
"""

import logging
import threading
import time
import webbrowser

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.config import settings
from core.database import init_db
from core.mongodb import init_mongo

# Import every model so that Base.metadata is aware of all tables
# before init_db() creates them.
from models import (  # noqa: F401
    assessment,
    audit,
    booking,
    ingredient,
    lifestyle,
    notification,
    product,
    progress_photo,
    role,
    routine,
    skin_profile,
    user,
)

from routers import (
    admin,
    assessment as assessment_router,
    auth,
    booking as booking_router,
    consultant,
    dermatologist,
    ingredients as ingredients_router,
    lifestyle as lifestyle_router,
    notifications as notifications_router,
    products as products_router,
    profile,
    progress as progress_router,
    recommendations as recommendations_router,
    reports as reports_router,
    routine as routine_router,
    user as user_router,
)
from seed import run_seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("app.main")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI Skin Intelligence & Personalized Skincare Planner — REST API",
        version="1.0.0",
    )

    # ---------------- Middleware ----------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---------------- Centralized exception handling ----------------
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.detail},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "message": "Validation error", "errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Internal server error"},
        )

    # ---------------- Routers ----------------
    app.include_router(auth.router)
    app.include_router(user_router.router)
    app.include_router(profile.router)
    app.include_router(lifestyle_router.router)
    app.include_router(admin.router)
    app.include_router(consultant.router)
    app.include_router(dermatologist.router)
    app.include_router(assessment_router.router)
    app.include_router(routine_router.router)
    app.include_router(booking_router.router)
    app.include_router(products_router.router)
    app.include_router(ingredients_router.router)
    app.include_router(recommendations_router.router)
    app.include_router(progress_router.router)
    app.include_router(notifications_router.router)
    app.include_router(reports_router.router)

    # ---------------- Uploaded file access ----------------
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

    # ---------------- Serve the React production build ----------------
    frontend_dir = settings.FRONTEND_BUILD_DIR
    if frontend_dir.exists():
        assets_dir = frontend_dir / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_react(full_path: str):
            """
            Serve the React SPA for any non-API route so that client-side
            routing (React Router) works correctly on full page reloads.

            Requests under /api or /uploads that reach this point matched
            no real route (wrong method, unknown path) and must NOT fall
            through to the SPA — otherwise a mistaken/unsupported API call
            would silently receive index.html instead of a proper 404.
            """
            if full_path.startswith("api/") or full_path.startswith("uploads/") or full_path in ("api", "uploads"):
                raise StarletteHTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

            candidate = frontend_dir / full_path
            if full_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(frontend_dir / "index.html")
    else:
        logger.warning(
            "Frontend build not found at %s. Run `npm run build` inside /frontend "
            "to enable full-stack single-command startup.",
            frontend_dir,
        )

    return app


app = create_app()


def open_browser_when_ready(url: str) -> None:
    """Wait briefly for Uvicorn to bind, then open the default browser."""
    time.sleep(1.5)
    try:
        webbrowser.open(url)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not automatically open browser: %s", exc)


def main() -> None:
    logger.info("Starting %s ...", settings.APP_NAME)

    # Create tables and seed roles/demo accounts before serving requests.
    init_db()
    run_seed()
    init_mongo()

    url = f"http://{settings.HOST}:{settings.PORT}"

    if settings.OPEN_BROWSER:
        threading.Thread(target=open_browser_when_ready, args=(url,), daemon=True).start()

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
