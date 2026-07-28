from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongo import mongo_db
from app.db.postgres import engine, Base
from app.routes import auth, admin, consultant, dermatologist, skin_profile, lifestyle, engagement, dashboard, assessment_engine, users, products, reports, verifications
from app.routes import appointments as appointments_router
import app.models.assessment  # noqa
import app.models  # noqa: ensures all models are registered before mapper configuration
import app.models.engagement  # noqa: registers the new engagement tables
import app.models.recommendation  # noqa: registers recommendation tables
import app.models.availability  # noqa: registers professional_availability table

Base.metadata.create_all(bind=engine)

from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE skin_assessments ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS concerns VARCHAR(500);"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_instructions TEXT;"))
        conn.execute(text("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50);"))

        # Milestone 2 — Lifestyle Log new columns
        conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS smoking BOOLEAN;"))
        conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS alcohol BOOLEAN;"))
        conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS screen_time_hours DOUBLE PRECISION;"))
        conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS sun_protection_used BOOLEAN;"))
        conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS uv_index DOUBLE PRECISION;"))
        conn.execute(text("ALTER TABLE lifestyle_logs ADD COLUMN IF NOT EXISTS pollution_exposure VARCHAR(50);"))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS recommendations (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                assessment_id UUID,
                reason TEXT,
                confidence_score DOUBLE PRECISION,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
            );
        """))
except Exception as e:
    print("Database migration warning:", e)

app = FastAPI(title="AI Skin Intelligence & Personalized Skincare Planner")

@app.on_event("startup")
def startup_event():
    from app.db.postgres import SessionLocal
    from app.routes.products import seed_catalog_if_empty
    db = SessionLocal()
    try:
        seed_catalog_if_empty(db)
    except Exception as e:
        print("Failed to seed catalog:", e)
    finally:
        db.close()

import os
from fastapi.staticfiles import StaticFiles

os.makedirs("app/uploads/dermatologist", exist_ok=True)
os.makedirs("app/uploads/consultant", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(admin.router)
app.include_router(consultant.router)
app.include_router(dermatologist.router)
app.include_router(skin_profile.router)
app.include_router(lifestyle.router)
app.include_router(engagement.router)
app.include_router(dashboard.router)
app.include_router(assessment_engine.router)
app.include_router(appointments_router.router)
app.include_router(reports.router)
app.include_router(verifications.router)
app.include_router(verifications.pro_router)
app.include_router(verifications.router_docs)


@app.get("/")
def root():
    return {"message": "Skin Intelligence API is running"}


@app.get("/health/db")
def check_db():
    result = {}
    try:
        with engine.connect() as conn:
            result["postgresql"] = "connected"
    except Exception as e:
        result["postgresql"] = f"error: {str(e)}"
    try:
        mongo_db.command("ping")
        result["mongodb"] = "connected"
    except Exception as e:
        result["mongodb"] = f"error: {str(e)}"
    return result