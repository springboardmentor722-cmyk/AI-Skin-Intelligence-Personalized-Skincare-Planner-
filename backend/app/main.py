from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import auth, users, skin_profile, lifestyle, dermatologists, recommendations, appointments, progress, workspace, assessment, routine, admin, photos, checkins, ingredients, analytics

# Creates tables if they don't exist. In production, use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Skin Intelligence & Personalized Skincare Planner API",
    description="Milestone 3: role-based skincare safety checkins, compliance dashboards, photo tracking.",
    version="0.3.0",
)

import os

# Ensure static directory exists before mounting
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://skincare-planner.vercel.app",
        "https://skincare-planner-nasheer.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175"
    ],
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dermatologists.router)
app.include_router(appointments.router)
app.include_router(progress.router)
app.include_router(workspace.router)
app.include_router(recommendations.router)
app.include_router(skin_profile.router)
app.include_router(lifestyle.router)
app.include_router(assessment.router)
app.include_router(routine.router)
app.include_router(admin.router)
app.include_router(photos.router)
app.include_router(checkins.router)
app.include_router(ingredients.router)
app.include_router(analytics.router)



@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "milestone": "1 - Foundation"}


from app.database import SessionLocal
from app.models import User, RoleEnum
from app.auth import hash_password

@app.on_event("startup")
def seed_admin_user():
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == RoleEnum.administrator).first()
        if not admin_exists:
            admin_user = User(
                full_name="System Administrator",
                email="admin@skincareplanner.com",
                hashed_password=hash_password("adminpassword123"),
                role=RoleEnum.administrator,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("[SEED] Created default admin user: admin@skincareplanner.com / adminpassword123")
    except Exception as e:
        print("[SEED] Admin seed failed:", e)
    finally:
        db.close()
