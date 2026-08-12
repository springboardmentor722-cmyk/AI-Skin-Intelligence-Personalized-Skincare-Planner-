from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ingredient import Ingredient
from app.models.skin_profile import SkinProfile
from app.schemas.ingredient_schema import IngredientCreate, IngredientUpdate
from app.utils.auth import role_required
from app.services.ingredient_intelligence_service import analyze_ingredient

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])


def ingredient_or_404(ingredient_id: int, db: Session) -> Ingredient:
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    new_ingredient = Ingredient(**ingredient.model_dump())
    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)
    return new_ingredient


@router.get("/")
def get_ingredients(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Ingredient).filter(Ingredient.is_active.is_(True))
    if search and search.strip():
        value = search.strip()
        query = query.filter(or_(Ingredient.ingredient_name.ilike(f"%{value}%"), Ingredient.short_description.ilike(f"%{value}%"), Ingredient.description.ilike(f"%{value}%"), Ingredient.benefits.ilike(f"%{value}%"), Ingredient.suitable_for.ilike(f"%{value}%")))
    return query.order_by(Ingredient.source_url.is_(None), Ingredient.ingredient_id).all()


@router.get("/admin")
def get_all_ingredients(search: Optional[str] = None, active: Optional[bool] = None, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    query = db.query(Ingredient)
    if active is not None:
        query = query.filter(Ingredient.is_active.is_(active))
    if search and search.strip():
        value = search.strip()
        query = query.filter(or_(Ingredient.ingredient_name.ilike(f"%{value}%"), Ingredient.short_description.ilike(f"%{value}%"), Ingredient.description.ilike(f"%{value}%"), Ingredient.benefits.ilike(f"%{value}%"), Ingredient.suitable_for.ilike(f"%{value}%")))
    return query.order_by(Ingredient.ingredient_id.asc()).all()


@router.get("/{ingredient_id}/analysis")
def ingredient_analysis(ingredient_id: int, db: Session = Depends(get_db), current_user=Depends(role_required(["USER"]))):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ingredient_id, Ingredient.is_active.is_(True)).first()
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Active ingredient not found")
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if profile is None:
        return analyze_ingredient(ingredient, None, None, None, None)
    return analyze_ingredient(ingredient, profile.skin_type, profile.skin_concerns, profile.allergies, profile.sensitivities)


@router.put("/{ingredient_id}")
def update_ingredient(ingredient_id: int, values: IngredientUpdate, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    ingredient = ingredient_or_404(ingredient_id, db)
    for field, value in values.model_dump().items():
        setattr(ingredient, field, value)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete("/{ingredient_id}")
def deactivate_ingredient(ingredient_id: int, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    ingredient = ingredient_or_404(ingredient_id, db)
    ingredient.is_active = False
    db.commit()
    return {"message": "Ingredient deactivated"}
