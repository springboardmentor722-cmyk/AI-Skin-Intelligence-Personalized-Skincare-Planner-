from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app FIRST
app = FastAPI(
    title="AI Skincare Intelligence API",
    description="API for personalized skincare recommendations",
    version="1.0.0"
)

# ✅ ADD CORS MIDDLEWARE AS FIRST MIDDLEWARE!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# THEN import and setup database
from app.database import engine
from app import Base

# Import all models
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.lifestyle import LifestyleTracking
from app.models.dermatologist import DermatologistProfile
from app.models.consultant import ConsultantProfile
from app.models.admin import AdminProfile
from app.models.consultation import Consultation
from app.models.skin_screening import SkinScreening

# Create all tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables: {e}")

# THEN import and include routes
from app.routes import auth, profile, user_profile, user_lifestyle, user_products, user_ingredients, user_routine, user_progress, user_screening, user_consultation, dermatologist_routes, admin_routes, consultant_routes, admin_consultations, consultant_patients, dermatologist_patients

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(user_profile.router)
app.include_router(user_lifestyle.router)
app.include_router(user_products.router)
app.include_router(user_ingredients.router)
app.include_router(user_routine.router)
app.include_router(user_progress.router)
app.include_router(user_screening.router)
app.include_router(user_consultation.router)
app.include_router(dermatologist_routes.router)
app.include_router(admin_routes.router)
app.include_router(consultant_routes.router)
app.include_router(admin_consultations.router)
app.include_router(consultant_patients.router)
app.include_router(dermatologist_patients.router)

@app.get("/")
async def root():
    return {"message": "AI Skincare Intelligence API"}