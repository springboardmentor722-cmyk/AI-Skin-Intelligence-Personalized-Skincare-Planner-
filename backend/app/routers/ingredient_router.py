from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.models.ingredient import Ingredient
from app.schemas.ingredient_schema import IngredientCreate

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

@router.post("/")
def add_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    new_ingredient = Ingredient(**ingredient.model_dump())

    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)

    return {
        "message": "Ingredient Added",
        "ingredient_id": new_ingredient.ingredient_id
    }

from typing import Optional

@router.get("/")
def get_ingredients(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ingredient)

    if search:
        query = query.filter(
            or_(Ingredient.ingredient_name.ilike(f"%{search}%"), Ingredient.short_description.ilike(f"%{search}%"), Ingredient.description.ilike(f"%{search}%"), Ingredient.benefits.ilike(f"%{search}%"), Ingredient.suitable_for.ilike(f"%{search}%"))
        )

    return query.order_by(Ingredient.source_url.is_(None), Ingredient.ingredient_id).all()
