from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role

router = APIRouter(prefix="/api/products", tags=["Products"])

# GET ALL PRODUCTS WITH SEARCH & FILTER
@router.get("/")
async def get_products(
    search: str = Query(None),
    category: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    min_rating: float = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Get products with search, filter, and pagination"""
    try:
        query = "SELECT product_id, brand, name, price, review_score, n_of_reviews FROM products WHERE 1=1"
        params = {}
        
        # Search by name or brand
        if search:
            query += " AND (LOWER(name) LIKE LOWER(:search) OR LOWER(brand) LIKE LOWER(:search))"
            params["search"] = f"%{search}%"
        
        # Filter by category
        if category:
            category_col = f"category_{category.lower()}"
            query += f" AND {category_col} = true"
        
        # Price range
        if min_price is not None:
            query += " AND price >= :min_price"
            params["min_price"] = min_price
        if max_price is not None:
            query += " AND price <= :max_price"
            params["max_price"] = max_price
        
        # Rating filter
        if min_rating is not None:
            query += " AND review_score >= :min_rating"
            params["min_rating"] = min_rating
        
        # Add pagination
        query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset
        
        results = db.execute(text(query), params).all()
        
        products = [
            {
                "product_id": r[0],
                "brand": r[1],
                "name": r[2],
                "price": float(r[3]),
                "rating": float(r[4]) if r[4] else 0,
                "reviews": r[5]
            }
            for r in results
        ]
        
        return {"products": products, "count": len(products)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET PRODUCT DETAILS
@router.get("/{product_id}")
async def get_product_details(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed product information"""
    try:
        result = db.execute(
            text("""
                SELECT product_id, brand, name, price, review_score, n_of_reviews, 
                       size, clean_product, price_per_ounce
                FROM products WHERE product_id = :product_id
            """),
            {"product_id": product_id}
        ).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "product_id": result[0],
            "brand": result[1],
            "name": result[2],
            "price": float(result[3]),
            "rating": float(result[4]) if result[4] else 0,
            "reviews": result[5],
            "size": result[6],
            "clean_product": bool(result[7]),
            "price_per_ounce": float(result[8]) if result[8] else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SAVE FAVORITE PRODUCT
@router.post("/favorite/{product_id}")
async def save_favorite(
    product_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Save product as favorite"""
    try:
        # Check if already favorited
        existing = db.execute(
            text("""
                SELECT favorite_id FROM favorite_products 
                WHERE user_id = :user_id AND product_id = :product_id
            """),
            {"user_id": current_user.user_id, "product_id": product_id}
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already added to favorites")
        
        db.execute(
            text("""
                INSERT INTO favorite_products (user_id, product_id, saved_date)
                VALUES (:user_id, :product_id, CURRENT_TIMESTAMP)
            """),
            {"user_id": current_user.user_id, "product_id": product_id}
        )
        db.commit()
        
        return {"message": "Added to favorites"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# REMOVE FAVORITE PRODUCT
@router.delete("/favorite/{product_id}")
async def remove_favorite(
    product_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Remove product from favorites"""
    try:
        db.execute(
            text("""
                DELETE FROM favorite_products 
                WHERE user_id = :user_id AND product_id = :product_id
            """),
            {"user_id": current_user.user_id, "product_id": product_id}
        )
        db.commit()
        
        return {"message": "Removed from favorites"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# GET USER'S FAVORITE PRODUCTS
@router.get("/favorites/list")
async def get_favorites(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get user's favorite products"""
    try:
        results = db.execute(
            text("""
                SELECT p.product_id, p.brand, p.name, p.price, p.review_score
                FROM favorite_products fp
                JOIN products p ON fp.product_id = p.product_id
                WHERE fp.user_id = :user_id
                ORDER BY fp.saved_date DESC
            """),
            {"user_id": current_user.user_id}
        ).all()
        
        products = [
            {
                "product_id": r[0],
                "brand": r[1],
                "name": r[2],
                "price": float(r[3]),
                "rating": float(r[4]) if r[4] else 0
            }
            for r in results
        ]
        
        return {"favorites": products, "count": len(products)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CHECK IF PRODUCT IS FAVORITED
@router.get("/favorite/{product_id}/status")
async def check_favorite(
    product_id: int,
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Check if product is favorited"""
    try:
        result = db.execute(
            text("""
                SELECT favorite_id FROM favorite_products 
                WHERE user_id = :user_id AND product_id = :product_id
            """),
            {"user_id": current_user.user_id, "product_id": product_id}
        ).first()
        
        return {"is_favorited": bool(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))