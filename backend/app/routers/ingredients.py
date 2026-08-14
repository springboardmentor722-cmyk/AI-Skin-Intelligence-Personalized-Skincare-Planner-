from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, engine
from ..database import get_db
from ..deps import get_current_user, require_roles

router = APIRouter(prefix="/api/ingredients", tags=["Ingredients"])


@router.get("", response_model=List[schemas.IngredientOut])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(models.Ingredient).all()


@router.get("/{ingredient_id}", response_model=schemas.IngredientOut)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ing = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ing


@router.post("/check-suitability")
def check_suitability(
    payload: schemas.IngredientCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a skin profile first.")

    all_ingredients = {i.name.lower(): i for i in db.query(models.Ingredient).all()}
    results = []
    for name in payload.ingredient_names:
        ing = all_ingredients.get(name.lower())
        if not ing:
            results.append({"ingredient": name, "suitable": None, "warnings": ["Ingredient not found in database."]})
            continue
        results.append(engine.check_ingredient_suitability(ing, profile))

    interactions = engine.check_ingredient_interactions(payload.ingredient_names, all_ingredients)
    return {"results": results, "interaction_warnings": interactions}


@router.post("", response_model=schemas.IngredientOut)
def create_ingredient(
    ingredient: schemas.IngredientOut,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "dermatologist")),
):
    data = ingredient.model_dump(exclude={"id"})
    new_ing = models.Ingredient(**data)
    db.add(new_ing)
    db.commit()
    db.refresh(new_ing)
    return new_ing
