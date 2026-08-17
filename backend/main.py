from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ============================================
# CREATE FASTAPI APP FIRST
# ============================================
app = FastAPI(
    title="Glow & Thrive - AI Skincare Intelligence Platform",
    description="Personal skincare companion with expert guidance",
    version="1.0.0"
)

# ============================================
# CORS MIDDLEWARE (MUST BE FIRST!)
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.staticfiles import StaticFiles
import os

# ============================================
# STATIC FILES (for uploaded progress photos)
# ============================================
if not os.path.exists("uploads"):
    os.makedirs("uploads/progress", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ============================================
# IMPORT ROUTES
# ============================================
from app.routes import (
    auth,
    profile,
    user_profile,
    user_lifestyle,
    user_products,
    user_ingredients,
    user_routine,
    user_progress,
    user_screening,
    user_consultation,
    dermatologist_routes,
    admin_routes,
    consultant_routes,
    admin_consultations,
    consultant_patients,
    dermatologist_patients
)

# ============================================
# INCLUDE ALL ROUTERS
# ============================================

# Auth routes
app.include_router(auth.router)

# User profile routes
app.include_router(profile.router)
app.include_router(user_profile.router)

# User lifestyle & tracking
app.include_router(user_lifestyle.router)

# User products & ingredients
app.include_router(user_products.router)
app.include_router(user_ingredients.router)

# User routine & progress
app.include_router(user_routine.router)
app.include_router(user_progress.router)

# User screening & consultation
app.include_router(user_screening.router)
app.include_router(user_consultation.router)

# Admin routes
app.include_router(admin_routes.router)
app.include_router(admin_consultations.router)

# Consultant routes
app.include_router(consultant_routes.router)
app.include_router(consultant_patients.router)

# Dermatologist routes
app.include_router(dermatologist_routes.router)
app.include_router(dermatologist_patients.router)

# ============================================
# HEALTH CHECK ENDPOINT
# ============================================
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Glow & Thrive API is running"}

# ============================================
# ROOT ENDPOINT
# ============================================
@app.get("/")
async def root():
    return {
        "message": "Welcome to Glow & Thrive - AI Skincare Intelligence Platform",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )