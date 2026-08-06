from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product,User
from app.schemas import ProductResponse
from typing import Optional
from app.dependencies import get_current_user
from app.schemas import ProductCreate

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# Database Dependency



@router.get("/", response_model=list[ProductResponse])
def get_all_products(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return db.query(Product).offset(skip).limit(limit).all()

@router.get("/search", response_model=list[ProductResponse])
def search_products(
    name: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if name:
        query = query.filter(Product.product_name.ilike(f"%{name}%"))

    if brand:
        query = query.filter(Product.brand_name.ilike(f"%{brand}%"))

    if category:
         query = query.filter(Product.category.ilike(f"%{category}%"))

    return query.offset(skip).limit(limit).all()

@router.get("/brands")
def get_brands(db: Session = Depends(get_db)):
    brands = (
        db.query(Product.brand_name)
        .distinct()
        .filter(Product.brand_name != None)
        .order_by(Product.brand_name)
        .all()
    )

    return [brand[0] for brand in brands]

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = (
        db.query(Product.category)
        .distinct()
        .filter(Product.category != None)
        .order_by(Product.category)
        .all()
    )

    return [category[0] for category in categories]

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product

@router.post(
    "/",
    response_model=ProductResponse
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can add products."
        )

    new_product = Product(
        **product.dict()
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: str,
    updated_product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can update products."
        )

    product = (
        db.query(Product)
        .filter(Product.product_id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    for key, value in updated_product.dict().items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can delete products."
        )

    product = (
        db.query(Product)
        .filter(Product.product_id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully."
    }