from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_user_role

router = APIRouter(prefix="/api/user/products", tags=["Products"])

# ============================================
# GET RECOMMENDED PRODUCTS (MUST BE FIRST!)
# ============================================
@router.get("/recommended")
async def get_recommended_products(
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get recommended products based on user's skin profile"""
    try:
        # 1️⃣ GET USER'S SKIN PROFILE
        skin_profile = db.execute(
            text("""
                SELECT skin_type, allergies, sensitivities
                FROM user_profiles
                WHERE user_id = :user_id
            """),
            {"user_id": current_user.user_id}
        ).first()
        
        if not skin_profile:
            # No skin profile, return top rated products
            products = db.execute(
                text("""
                    SELECT product_id, name, brand, price, review_score, size
                    FROM products
                    WHERE review_score IS NOT NULL
                    ORDER BY review_score DESC
                    LIMIT 10
                """)
            ).all()
            
            product_list = [
                {
                    "product_id": p[0],
                    "name": p[1],
                    "brand": p[2],
                    "price": float(p[3]) if p[3] else 0,
                    "rating": float(p[4]) if p[4] else 0,
                    "size": p[5],
                    "reason": "Highly Rated Product"
                }
                for p in products
            ]
            
            return {"recommended_products": product_list, "count": len(product_list)}
        
        skin_type = skin_profile[0]
        allergies = skin_profile[1] or ""
        sensitivities = skin_profile[2] or ""
        
        # 2️⃣ BUILD CATEGORY FILTER BASED ON SKIN TYPE
        category_filters = {
            "Oily": {
                "categories": ["category_face_wash", "category_toners", "category_serums"],
                "reason": "Ideal for Oily Skin - Controls oil & balances"
            },
            "Dry": {
                "categories": ["category_moisturizer", "category_oils", "category_serums"],
                "reason": "Hydrating Solution - Deep moisture for dry skin"
            },
            "Combination": {
                "categories": ["category_moisturizer", "category_face_wash", "category_serums"],
                "reason": "Balanced Care - Works for combination skin"
            },
            "Normal": {
                "categories": ["category_moisturizer", "category_serums", "category_face_wash"],
                "reason": "Perfect for Normal Skin - Maintains healthy balance"
            },
            "Sensitive": {
                "categories": ["category_face_wash", "category_serums"],
                "reason": "Gentle Formula - Soothing for sensitive skin"
            }
        }
        
        # Get recommendation reason and categories
        reason = "Recommended Product"
        categories_to_query = []
        
        if skin_type in category_filters:
            reason = category_filters[skin_type]["reason"]
            categories_to_query = category_filters[skin_type]["categories"]
        
        # Add sunscreen for all skin types
        if "category_sunscreen" not in categories_to_query:
            categories_to_query.append("category_sunscreen")
        
        # 3️⃣ BUILD QUERY TO FILTER PRODUCTS
        # Create WHERE clause for categories
        category_conditions = " OR ".join([f"{cat} = true" for cat in categories_to_query])
        
        query = f"""
            SELECT product_id, name, brand, price, review_score, size,
                   category_face_wash, category_moisturizer, category_serums,
                   category_sunscreen, category_toners, category_oils
            FROM products
            WHERE ({category_conditions})
            AND review_score IS NOT NULL
            AND review_score > 0
            ORDER BY review_score DESC
            LIMIT 10
        """
        
        print(f"[RECOMMENDED] Skin Type: {skin_type}, Query: {query[:100]}...")
        
        products = db.execute(text(query)).all()
        
        print(f"[RECOMMENDED] Found {len(products)} products")
        
        product_list = []
        for p in products:
            product_id, name, brand, price, rating, size = p[0:6]
            
            # Build category labels
            category_labels = []
            if p[6]:  # face_wash
                category_labels.append("Face Wash")
            if p[7]:  # moisturizer
                category_labels.append("Moisturizer")
            if p[8]:  # serums
                category_labels.append("Serum")
            if p[9]:  # sunscreen
                category_labels.append("Sunscreen")
            if p[10]:  # toners
                category_labels.append("Toner")
            if p[11]:  # oils
                category_labels.append("Oil")
            
            category_str = " + ".join(category_labels[:2])  # Show first 2 categories
            
            # Build complete reason
            if category_str:
                full_reason = f"{reason} - {category_str}"
            else:
                full_reason = reason
            
            product_list.append({
                "product_id": product_id,
                "name": name,
                "brand": brand,
                "price": float(price) if price else 0,
                "rating": float(rating) if rating else 0,
                "size": size,
                "reason": full_reason
            })
        
        return {"recommended_products": product_list, "count": len(product_list)}
    
    except Exception as e:
        print(f"Error fetching recommended products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET ALL PRODUCTS
# ============================================
@router.get("/")
async def get_products(
    current_user: User = Depends(require_user_role),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all available products"""
    try:
        products = db.execute(
            text("""
                SELECT product_id, name, brand, price, review_score, size, category_moisturizer,
                       category_face_wash, category_serums, category_sunscreen, category_masks
                FROM products
                LIMIT :limit
            """),
            {"limit": limit}
        ).all()
        
        product_list = [
            {
                "product_id": p[0],
                "name": p[1],
                "brand": p[2],
                "price": float(p[3]) if p[3] else 0,
                "rating": float(p[4]) if p[4] else 0,
                "size": p[5],
                "category": "Moisturizer" if p[6] else "Face Wash" if p[7] else "Serum" if p[8] else "Sunscreen" if p[9] else "Mask" if p[10] else "Other"
            }
            for p in products
        ]
        
        return {"products": product_list, "count": len(product_list)}
    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET PRODUCT DETAILS (GENERIC - MUST BE LAST!)
# ============================================
@router.get("/{product_id}")
async def get_product_details(
    product_id: int,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get details of a specific product"""
    try:
        product = db.execute(
            text("""
                SELECT product_id, name, brand, price, review_score, size, clean_product
                FROM products
                WHERE product_id = :product_id
            """),
            {"product_id": product_id}
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "product_id": product[0],
            "name": product[1],
            "brand": product[2],
            "price": float(product[3]) if product[3] else 0,
            "rating": float(product[4]) if product[4] else 0,
            "size": product[5],
            "is_clean": product[6]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))