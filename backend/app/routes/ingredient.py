from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Ingredient
from app.dependencies import get_current_user
from app.models import User
from app.schemas import IngredientResponse
router = APIRouter(
    prefix="/ingredients",
    tags=["Ingredients"]
)


# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# GET All Ingredients (with Pagination)
@router.get("/", response_model=list[IngredientResponse])
def get_all_ingredients(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return db.query(Ingredient).offset(skip).limit(limit).all()


# Search Ingredients
@router.get("/search", response_model=list[IngredientResponse])
def search_ingredients(
    name: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ingredient)

    if name:
        query = query.filter(
            Ingredient.ingredient_name.ilike(f"%{name}%")
        )

    if category:
        query = query.filter(
            Ingredient.category.ilike(f"%{category}%")
        )

@router.get("/search", response_model=list[IngredientResponse])
def search_ingredients(
    name: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Ingredient)

    if name:
        query = query.filter(
            Ingredient.ingredient_name.ilike(f"%{name}%")
        )

    if category:
        query = query.filter(
            Ingredient.category.ilike(f"%{category}%")
        )

    return query.offset(skip).limit(limit).all()

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db)
):
    categories = (
        db.query(Ingredient.category)
        .distinct()
        .all()
    )

    return sorted([
        c[0]
        for c in categories
        if c[0]
    ])


# GET Ingredient by ID
@router.get("/{ingredient_id}", response_model=IngredientResponse)
def get_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db)
):
    ingredient = db.query(Ingredient).filter(
        Ingredient.id == ingredient_id
    ).first()

    if ingredient is None:
        raise HTTPException(
            status_code=404,
            detail="Ingredient not found"
        )

    return ingredient

