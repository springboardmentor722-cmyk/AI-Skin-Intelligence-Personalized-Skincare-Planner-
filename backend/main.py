from fastapi import FastAPI

from fastapi.staticfiles import StaticFiles
import os
from app.database.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
# Import all models
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.lifestyle import Lifestyle
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.progress import Progress
from app.models.consultation import Consultation
from app.models.report import Report
from app.models.skin_assessment import SkinAssessment
from app.models.notification import Notification

# Import routers
from app.routers.user_router import router as user_router
from app.routers.skin_profile_router import router as skin_router
from app.routers.lifestyle_router import router as lifestyle_router
from app.routers.product_router import router as product_router
from app.routers.ingredient_router import router as ingredient_router
from app.routers.progress_router import router as progress_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.consultation_router import router as consultation_router
from app.routers.report_router import router as report_router
from app.routers.ai_router import router as ai_router
from app.routers.skin_assessment_router import router as skin_assessment_router
from app.routers.notification_router import router as notification_router

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="Skin Intelligence")
os.makedirs("uploads/skin_images", exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include routers
app.include_router(user_router)
app.include_router(skin_router)
app.include_router(lifestyle_router)
app.include_router(product_router)
app.include_router(ingredient_router)
app.include_router(progress_router)
app.include_router(dashboard_router)
app.include_router(consultation_router)
app.include_router(report_router)
app.include_router(ai_router)
app.include_router(skin_assessment_router)
app.include_router(notification_router)
# Home API
@app.get("/")
def home():
    return {"message": "Skin Intelligence API is Running"}
