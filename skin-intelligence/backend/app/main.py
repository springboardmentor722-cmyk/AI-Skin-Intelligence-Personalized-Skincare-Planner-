from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.postgres import engine, Base
from app.api.routes import auth, analysis, routine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience only — use Alembic migrations in production
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered facial skin analysis and personalized skincare planning platform.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX)
app.include_router(routine.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
