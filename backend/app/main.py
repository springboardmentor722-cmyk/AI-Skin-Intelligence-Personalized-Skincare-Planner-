from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app import models
from app.routes import auth
from app.routes import skin_profile
from app.routes import lifestyle
from app.routes import product
from app.routes import ingredient
from app.routes import progress
from app.routes import dashboard
from app.routes import admin
from app.routes import role_request
from fastapi.staticfiles import StaticFiles
from app.routes import ai_assessment
from app.routes import recommendation
from app.routes import appointment
from app.routes import consultant
from app.routes import notification
from app.routes import consultant_monitoring
from app.routes import dermatologist
from app.routes import treatment

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Skin Intelligence API",
    description="Backend API for AI Skin Intelligence & Personalized Skincare Planner",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
app.include_router(auth.router)
app.include_router(skin_profile.router)
app.include_router(lifestyle.router)
app.include_router(product.router)
app.include_router(ingredient.router)
app.include_router(progress.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(role_request.router)
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.include_router(ai_assessment.router)
app.include_router(recommendation.router)
app.include_router(appointment.router)
app.include_router(consultant.router)
app.include_router(notification.router)
app.include_router(
    consultant_monitoring.router
)
app.include_router(dermatologist.router)
app.include_router(treatment.router)

@app.get("/")
def home():
    return {
        "message": "Welcome to AI Skin Intelligence API"
    }


@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "Database Connected Successfully"
        }
    except Exception as e:
        return {
            "status": "Database Connection Failed",
            "error": str(e)
        }