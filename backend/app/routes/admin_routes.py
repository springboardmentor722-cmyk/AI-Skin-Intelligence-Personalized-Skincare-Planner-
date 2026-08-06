from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import require_admin_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# GET ALL USERS
@router.get("/users")
async def get_all_users(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all users"""
    try:
        users = db.execute(
            text("""
                SELECT user_id, first_name, last_name, email, role_id, is_active, is_approved, created_at
                FROM users
                ORDER BY created_at DESC
            """)
        ).all()
        
        user_list = [
            {
                "user_id": r[0],
                "name": f"{r[1]} {r[2]}",
                "email": r[3],
                "role_id": r[4],
                "is_active": bool(r[5]),
                "is_approved": bool(r[6]),
                "created_at": str(r[7])
            }
            for r in users
        ]
        
        return {"users": user_list, "count": len(user_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET PENDING USERS (awaiting approval)
@router.get("/pending-users")
async def get_pending_users(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get pending user registrations"""
    try:
        pending = db.execute(
            text("""
                SELECT u.user_id, u.first_name, u.last_name, u.email, u.role_id, u.created_at
                FROM users u
                WHERE u.is_approved = FALSE
                ORDER BY u.created_at ASC
            """)
        ).all()
        
        pending_list = [
            {
                "user_id": r[0],
                "name": f"{r[1]} {r[2]}",
                "email": r[3],
                "role": self._get_role_name(r[4]),
                "created_at": str(r[5])
            }
            for r in pending
        ]
        
        return {"pending_users": pending_list, "count": len(pending_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# APPROVE USER
@router.put("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Approve a pending user registration"""
    try:
        db.execute(
            text("""
                UPDATE users 
                SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )
        db.commit()
        
        return {"message": "User approved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# REJECT USER
@router.put("/users/{user_id}/reject")
async def reject_user(
    user_id: int,
    rejection_data: dict,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Reject a pending user registration"""
    try:
        db.execute(
            text("""
                UPDATE users 
                SET is_approved = FALSE, rejection_reason = :reason, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id
            """),
            {"user_id": user_id, "reason": rejection_data.get("reason")}
        )
        db.commit()
        
        return {"message": "User rejected"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# DISABLE USER
@router.put("/users/{user_id}/disable")
async def disable_user(
    user_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Disable a user account"""
    try:
        db.execute(
            text("""
                UPDATE users 
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )
        db.commit()
        
        return {"message": "User disabled"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# DELETE USER
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    try:
        db.execute(
            text("DELETE FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        db.commit()
        
        return {"message": "User deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# MANAGE PRODUCTS
@router.get("/products")
async def get_all_products(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all products for admin management"""
    try:
        products = db.execute(
            text("""
                SELECT product_id, brand, name, price, review_score, created_at
                FROM products
                ORDER BY created_at DESC LIMIT 100
            """)
        ).all()
        
        product_list = [
            {
                "product_id": r[0],
                "brand": r[1],
                "name": r[2],
                "price": float(r[3]),
                "rating": float(r[4]) if r[4] else 0,
                "created_at": str(r[5])
            }
            for r in products
        ]
        
        return {"products": product_list, "count": len(product_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE PRODUCT
@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    product_data: dict,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update product information"""
    try:
        updates = []
        params = {"product_id": product_id}
        
        if "price" in product_data:
            updates.append("price = :price")
            params["price"] = product_data["price"]
        if "name" in product_data:
            updates.append("name = :name")
            params["name"] = product_data["name"]
        
        if updates:
            query = f"UPDATE products SET {', '.join(updates)} WHERE product_id = :product_id"
            db.execute(text(query), params)
            db.commit()
        
        return {"message": "Product updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# DELETE PRODUCT
@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Delete a product"""
    try:
        db.execute(
            text("DELETE FROM products WHERE product_id = :product_id"),
            {"product_id": product_id}
        )
        db.commit()
        
        return {"message": "Product deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# MANAGE INGREDIENTS
@router.get("/ingredients")
async def get_all_ingredients(
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all ingredients for admin management"""
    try:
        ingredients = db.execute(
            text("""
                SELECT ingredient_id, name, what_does_it_do, created_at
                FROM ingredients
                ORDER BY created_at DESC LIMIT 100
            """)
        ).all()
        
        ingredient_list = [
            {
                "ingredient_id": r[0],
                "name": r[1],
                "benefits": r[2],
                "created_at": str(r[3])
            }
            for r in ingredients
        ]
        
        return {"ingredients": ingredient_list, "count": len(ingredient_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE INGREDIENT
@router.put("/ingredients/{ingredient_id}")
async def update_ingredient(
    ingredient_id: int,
    ingredient_data: dict,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update ingredient information"""
    try:
        updates = []
        params = {"ingredient_id": ingredient_id}
        
        if "what_does_it_do" in ingredient_data:
            updates.append("what_does_it_do = :benefits")
            params["benefits"] = ingredient_data["what_does_it_do"]
        if "who_is_it_good_for" in ingredient_data:
            updates.append("who_is_it_good_for = :good_for")
            params["good_for"] = ingredient_data["who_is_it_good_for"]
        
        if updates:
            query = f"UPDATE ingredients SET {', '.join(updates)} WHERE ingredient_id = :ingredient_id"
            db.execute(text(query), params)
            db.commit()
        
        return {"message": "Ingredient updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# DELETE INGREDIENT
@router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(
    ingredient_id: int,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Delete an ingredient"""
    try:
        db.execute(
            text("DELETE FROM ingredients WHERE ingredient_id = :ingredient_id"),
            {"ingredient_id": ingredient_id}
        )
        db.commit()
        
        return {"message": "Ingredient deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ASSIGN CONSULTANT TO USER
@router.post("/assign-consultant")
async def assign_consultant(
    assignment_data: dict,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Admin assigns one consultant to one user (one-to-one)"""
    try:
        user_id = assignment_data.get("user_id")
        consultant_id = assignment_data.get("consultant_id")
        
        # Check if user already has consultant
        existing = db.execute(
            text("SELECT assignment_id FROM consultation_assignments WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="User already has assigned consultant")
        
        db.execute(
            text("""
                INSERT INTO consultation_assignments 
                (user_id, consultant_id, assigned_by_admin_id, assignment_date, created_at)
                VALUES (:user_id, :consultant_id, :admin_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """),
            {
                "user_id": user_id,
                "consultant_id": consultant_id,
                "admin_id": current_user.user_id
            }
        )
        db.commit()
        
        return {"message": "Consultant assigned to user"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def _get_role_name(role_id):
    """Helper to get role name"""
    roles = {1: "User", 2: "Dermatologist", 3: "Consultant", 4: "Admin"}
    return roles.get(role_id, "Unknown")
