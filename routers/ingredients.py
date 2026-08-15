"""Ingredient Intelligence Engine routes — Milestone 3, Step 1."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import ingredient_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.ingredient import IngredientResponse, SafetyCheckRequest, SafetyCheckResponse

router = APIRouter(prefix="/api/v1/ingredients", tags=["Ingredient Intelligence"])


@router.post("/safety-check", response_model=SafetyCheckResponse)
def safety_check(
    payload: SafetyCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Score a product (or raw ingredient category list) for allergy matches and chemical conflicts."""
    return ingredient_controller.check_safety(db, current_user, payload)


@router.get("", response_model=list[IngredientResponse])
def list_ingredients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The full ingredient knowledge base — for the Ingredient Database reference page."""
    return ingredient_controller.list_ingredients(db)
