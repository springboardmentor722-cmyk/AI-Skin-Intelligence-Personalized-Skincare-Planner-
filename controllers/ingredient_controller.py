"""Ingredient Intelligence controller — Milestone 3, Step 1."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.skin_profile import SkinProfile
from models.user import User
from schemas.ingredient import SafetyCheckRequest
from services import ingredient_service


def check_safety(db: Session, user: User, payload: SafetyCheckRequest) -> dict:
    """
    POST /api/v1/ingredients/safety-check

    Resolves ingredient categories from either a product_id (looked up
    against the catalog) or an explicit category list, then runs the
    allergy + conflict checks against the CURRENT user's allergy profile.
    """
    if payload.product_id:
        categories = ingredient_service.get_categories_for_product(db, payload.product_id)
        if not categories and not payload.ingredient_categories:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or has no linked ingredients")
    else:
        categories = payload.ingredient_categories

    if not categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either a product_id or a list of ingredient_categories",
        )

    skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
    allergy_text = skin_profile.allergies if skin_profile else None

    return ingredient_service.compute_safety_score(db, categories, allergy_text)


def list_ingredients(db: Session):
    return ingredient_service.get_all_ingredients(db)
