from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/ingredients", tags=["Ingredients"])

# GET ALL INGREDIENTS
@router.get("/")
async def get_ingredients(
    search: str = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Get ingredients with optional search"""
    try:
        query = "SELECT ingredient_id, name, short_description, what_does_it_do FROM ingredients WHERE 1=1"
        params = {}
        
        if search:
            query += " AND (LOWER(name) LIKE LOWER(:search) OR LOWER(short_description) LIKE LOWER(:search))"
            params["search"] = f"%{search}%"
        
        query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset
        
        results = db.execute(text(query), params).all()
        
        ingredients = [
            {
                "ingredient_id": r[0],
                "name": r[1],
                "description": r[2],
                "benefits": r[3]
            }
            for r in results
        ]
        
        return {"ingredients": ingredients, "count": len(ingredients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET INGREDIENT DETAILS
@router.get("/{ingredient_id}")
async def get_ingredient_details(
    ingredient_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed ingredient information"""
    try:
        result = db.execute(
            text("""
                SELECT ingredient_id, name, scientific_name, short_description, 
                       what_is_it, what_does_it_do, who_is_it_good_for, who_should_avoid, url
                FROM ingredients WHERE ingredient_id = :ingredient_id
            """),
            {"ingredient_id": ingredient_id}
        ).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        
        return {
            "ingredient_id": result[0],
            "name": result[1],
            "scientific_name": result[2],
            "short_description": result[3],
            "what_is_it": result[4],
            "what_does_it_do": result[5],
            "good_for": result[6],
            "should_avoid": result[7],
            "url": result[8]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET INGREDIENTS BY SKIN CONCERN
@router.get("/concern/{concern_name}")
async def get_ingredients_by_concern(
    concern_name: str,
    db: Session = Depends(get_db)
):
    """Get recommended ingredients for a skin concern"""
    try:
        results = db.execute(
            text("""
                SELECT ingredient_id, name, what_does_it_do
                FROM ingredients 
                WHERE LOWER(who_is_it_good_for) LIKE LOWER(:concern)
                LIMIT 10
            """),
            {"concern": f"%{concern_name}%"}
        ).all()
        
        ingredients = [
            {
                "ingredient_id": r[0],
                "name": r[1],
                "benefits": r[2]
            }
            for r in results
        ]
        
        return {"ingredients": ingredients}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))