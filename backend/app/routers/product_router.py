from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.models.product import Product
from app.schemas.product_schema import ProductCreate

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/")
def add_product(product: ProductCreate, db: Session = Depends(get_db)):

    new_product = Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product Added Successfully",
        "product_id": new_product.product_id
    }


@router.get("/")
def get_products(
    search: Optional[str] = None,
    skin_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Product)

    if search:
        query = query.filter(
            or_(Product.product_name.ilike(f"%{search}%"), Product.brand.ilike(f"%{search}%"), Product.category.ilike(f"%{search}%"), Product.ingredients.ilike(f"%{search}%"))
        )

    if skin_type:
        query = query.filter(
            Product.skin_type == skin_type
        )

    if category:
        query = query.filter(
            Product.category == category
        )

    return query.order_by(Product.product_url.is_(None), Product.product_id).all()
