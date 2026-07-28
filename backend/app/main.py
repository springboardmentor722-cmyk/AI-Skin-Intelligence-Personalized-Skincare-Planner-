"""Lumen — AI Skin Intelligence & Personalized Skincare Planner (Milestone 1 API)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, engine
from .routers import (admin, ai, appointments, assessment, auth, consultants,
                      dermatologists, google_auth, products, progress, users)

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lumen API",
    version="1.0.0",
    description=(
        "Milestone 1: authentication, role-based access control, skin profiles, "
        "lifestyle tracking, dermatologist booking, consultant requests, products, "
        "progress tracking, notifications, and a full admin surface with audit logs."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth.router, google_auth.router, users.router, dermatologists.router,
               appointments.router, consultants.router, products.router,
               progress.router, admin.router):
    app.include_router(router, prefix="/api")

# Milestone 2 — mounted at /api/v1/* exactly as the specification requires.
app.include_router(assessment.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "lumen-api", "version": "1.0.0"}
