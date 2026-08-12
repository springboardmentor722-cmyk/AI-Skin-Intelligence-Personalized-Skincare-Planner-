from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.models.product import Product
from app.schemas.product_schema import ProductCreate

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# ==========================================
# ADD PRODUCT
# ==========================================

@router.post("/")
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    new_product = Product(
        **product.model_dump()
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product Added Successfully",
        "product_id": new_product.product_id
    }


# ==========================================
# GET PRODUCTS
# ==========================================

@router.get("/")
def get_products(
    search: Optional[str] = None,
    skin_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Product)

    # -------------------------------
    # SEARCH
    # -------------------------------

    if search and search.strip():

        search_value = search.strip()

        query = query.filter(

            or_(

                Product.product_name.ilike(
                    f"%{search_value}%"
                ),

                Product.brand.ilike(
                    f"%{search_value}%"
                ),

                Product.category.ilike(
                    f"%{search_value}%"
                ),

                Product.ingredients.ilike(
                    f"%{search_value}%"
                )

            )

        )

    # -------------------------------
    # SKIN TYPE
    # -------------------------------

    if skin_type and skin_type.strip():

        query = query.filter(
            Product.skin_type.ilike(
                skin_type.strip()
            )
        )

    # -------------------------------
    # CATEGORY
    # -------------------------------

    if category and category.strip():

        query = query.filter(
            Product.category.ilike(
                category.strip()
            )
        )

    # -------------------------------
    # ORDER
    # -------------------------------

    query = query.order_by(
        Product.product_id.asc()
    )

    return query.all()