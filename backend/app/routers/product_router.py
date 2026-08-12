from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.skin_profile import SkinProfile
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.utils.auth import role_required
from app.services.product_recommendation_service import evaluate_product

router = APIRouter(prefix="/products", tags=["Products"])


def product_or_404(product_id: int, db: Session) -> Product:
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_product(product: ProductCreate, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    new_product = Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/")
def get_products(search: Optional[str] = None, skin_type: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.is_active.is_(True))
    if search and search.strip():
        value = search.strip()
        query = query.filter(or_(Product.product_name.ilike(f"%{value}%"), Product.brand.ilike(f"%{value}%"), Product.category.ilike(f"%{value}%"), Product.ingredients.ilike(f"%{value}%")))
    if skin_type and skin_type.strip():
        query = query.filter(Product.skin_type.ilike(skin_type.strip()))
    if category and category.strip():
        query = query.filter(Product.category.ilike(category.strip()))
    return query.order_by(Product.product_id.asc()).all()


@router.get("/recommendations")
def product_recommendations(db: Session = Depends(get_db), current_user=Depends(role_required(["USER"]))):
    """Personalized, deterministic recommendations for the logged-in user only."""
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if profile is None:
        return {"recommendations": [], "warnings": ["Create a skin profile to receive personalized recommendations."], "formula": {"concern_match": 0.50, "skin_type_fit": 0.35, "rating": 0.15}}
    ingredients = db.query(Ingredient).filter(Ingredient.is_active.is_(True)).all()
    ingredients_by_name = {ingredient.ingredient_name.strip().lower(): ingredient for ingredient in ingredients if ingredient.ingredient_name}
    evaluated = [evaluate_product(product, ingredients_by_name, profile) for product in db.query(Product).filter(Product.is_active.is_(True)).all()]
    safe = sorted((item for item in evaluated if item["safety_status"] == "SAFE"), key=lambda item: item["recommendation_score"], reverse=True)
    warnings = sorted((item for item in evaluated if item["safety_status"] in {"WARNING", "UNKNOWN"}), key=lambda item: item["recommendation_score"], reverse=True)
    return {"recommendations": safe, "cautions": warnings, "formula": {"concern_match": 0.50, "skin_type_fit": 0.35, "rating": 0.15}}


@router.get("/admin")
def get_all_products(search: Optional[str] = None, active: Optional[bool] = None, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    query = db.query(Product)
    if active is not None:
        query = query.filter(Product.is_active.is_(active))
    if search and search.strip():
        value = search.strip()
        query = query.filter(or_(Product.product_name.ilike(f"%{value}%"), Product.brand.ilike(f"%{value}%"), Product.category.ilike(f"%{value}%"), Product.ingredients.ilike(f"%{value}%")))
    return query.order_by(Product.product_id.asc()).all()


@router.put("/{product_id}")
def update_product(product_id: int, values: ProductUpdate, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    product = product_or_404(product_id, db)
    for field, value in values.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def deactivate_product(product_id: int, db: Session = Depends(get_db), _=Depends(role_required(["ADMIN"]))):
    product = product_or_404(product_id, db)
    product.is_active = False
    db.commit()
    return {"message": "Product deactivated"}
