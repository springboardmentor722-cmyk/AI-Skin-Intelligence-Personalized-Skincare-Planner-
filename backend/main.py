from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import Base, SessionLocal, engine
from models import Product, Ingredient, ProductIngredient
from schemas import (
    ProductResponse, ProductCreate,
    IngredientResponse, IngredientCreate
)

import os
from fastapi.staticfiles import StaticFiles

from routers.auth_router import router as auth_router
from routers.skin_router import router as skin_router
from routers.lifestyle_router import router as lifestyle_router
from routers.specialists_router import router as specialists_router
from routers.admin_router import router as admin_router
from routers.milestone3_router import router as milestone3_router, UPLOAD_DIR


# Initialize all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Skin Intelligence & Personalized Skincare Planner API",
    version="3.0.0",
    description="Scalable backend API for Skin Health Assessment, Weighted Scoring, Routine Generation, Ingredient Intelligence, Progress Tracking, and Dermatologist Consultations."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount Static File Uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "errors": [str(exc.detail)]
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [f"{err.get('loc', [])[-1] if err.get('loc') else 'field'}: {err.get('msg', 'invalid')}" for err in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation Error",
            "errors": errors
        }
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Mount Modular Routers
app.include_router(auth_router)
app.include_router(skin_router)
app.include_router(lifestyle_router)
app.include_router(specialists_router)
app.include_router(admin_router)
app.include_router(milestone3_router)


# Root Health Check Endpoint
@app.get("/")
def home():
    return {
        "status": "online",
        "service": "AI Skin Intelligence API",
        "version": "2.0.0",
        "timestamp": str(datetime.utcnow())
    }


# Product Catalog & Ingredients Endpoints
@app.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@app.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    new_p = Product(**product.dict())
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    return new_p


@app.get("/ingredients", response_model=List[IngredientResponse])
def get_ingredients(db: Session = Depends(get_db)):
    return db.query(Ingredient).all()


@app.post("/ingredients", response_model=IngredientResponse)
def create_ingredient(ing: IngredientCreate, db: Session = Depends(get_db)):
    new_i = Ingredient(**ing.dict())
    db.add(new_i)
    db.commit()
    db.refresh(new_i)
    return new_i