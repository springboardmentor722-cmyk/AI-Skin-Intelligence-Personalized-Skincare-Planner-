from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role, require_user_role

router = APIRouter(prefix="/api/user/ingredients", tags=["Ingredients"])

# ============================================
# GET ALL INGREDIENTS
# ============================================
@router.get("/")
async def get_ingredients(
    current_user: User = Depends(require_user_role),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all available ingredients"""
    try:
        ingredients = db.execute(
            text("""
                SELECT ingredient_id, name, scientific_name, short_description, what_does_it_do, who_is_it_good_for
                FROM ingredients
                LIMIT :limit
            """),
            {"limit": limit}
        ).all()
        
        ingredient_list = [
            {
                "ingredient_id": i[0],
                "name": i[1],
                "scientific_name": i[2],
                "description": i[3],
                "benefits": i[4],
                "good_for": i[5]
            }
            for i in ingredients
        ]
        
        return {"ingredients": ingredient_list, "count": len(ingredient_list)}
    except Exception as e:
        print(f"Error fetching ingredients: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GET INGREDIENT DETAILS
# ============================================
@router.get("/{ingredient_id}")
async def get_ingredient_details(
    ingredient_id: int,
    current_user: User = Depends(require_user_role),
    db: Session = Depends(get_db)
):
    """Get details of a specific ingredient"""
    try:
        ingredient = db.execute(
            text("""
                SELECT ingredient_id, name, scientific_name, short_description, what_is_it,
                       what_does_it_do, who_is_it_good_for, who_should_avoid
                FROM ingredients
                WHERE ingredient_id = :ingredient_id
            """),
            {"ingredient_id": ingredient_id}
        ).first()
        
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        
        return {
            "ingredient_id": ingredient[0],
            "name": ingredient[1],
            "scientific_name": ingredient[2],
            "short_description": ingredient[3],
            "what_is_it": ingredient[4],
            "what_does_it_do": ingredient[5],
            "good_for": ingredient[6],
            "avoid_for": ingredient[7]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))