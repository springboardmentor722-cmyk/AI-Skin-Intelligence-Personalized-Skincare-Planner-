from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import (
    auth, users, profile, assessment, routines,
    ingredients, products, scoring, progress, notifications, reports, dashboard, journal,
    photos, verification,
)

# Auto-create tables on startup (fine for dev / SQLite; use Alembic migrations
# for a real production Postgres deployment).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Skin Intelligence & Personalized Skincare Planner",
    description="Backend API for skin profiling, AI-driven assessment, routine generation, "
                 "ingredient/product intelligence, health scoring, and progress tracking.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profile.router)
app.include_router(assessment.router)
app.include_router(routines.router)
app.include_router(ingredients.router)
app.include_router(products.router)
app.include_router(scoring.router)
app.include_router(progress.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(journal.router)
app.include_router(photos.router)
app.include_router(verification.router)


@app.get("/")
def root():
    return {
        "message": "AI Skin Intelligence & Personalized Skincare Planner API",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
