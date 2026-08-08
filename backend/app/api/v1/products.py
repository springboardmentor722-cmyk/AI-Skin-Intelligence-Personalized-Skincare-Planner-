from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
import joblib
import os
import pandas as pd

from app.api import deps
from app.models.user import User
from app.models.product import Product
from app.models.workflow import ScreeningRequest

# Load ML model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml", "rf_model.joblib")
try:
    model_data = joblib.load(MODEL_PATH)
    rf_model = model_data["model"]
    rf_features = model_data["features"]
except Exception as e:
    print(f"Warning: Could not load ML model from {MODEL_PATH}: {e}")
    rf_model = None
    rf_features = None

router = APIRouter()


@router.get("/recommendations")
def get_product_recommendations(
    category: Optional[str] = Query(None, description="Filter by product category"),
    max_price: Optional[float] = Query(None, description="Maximum price budget"),
    concern: Optional[str] = Query(None, description="Skin concern to target (e.g. Acne, Dryness)"),
    limit: int = Query(20, description="Max products to return"),
    source: str = Query("auto", description="Data source: 'csv' for dataset, 'db' for seeded DB, 'auto' for best available"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get personalized product recommendations.
    
    Priority order (no LLM):
    1. CSV Product RAG — filters the 8,494-row Sephora product_info.csv dataset
       using rule-based concern/skin-type/ingredient matching.
    2. DB Recommendation Engine — falls back to the seeded database products
       if CSV is unavailable or explicitly requested.
    """
    from app.models.skin_screening import SkinScreening
    from app.models.profile import SkinProfile

    # Fetch user profile for skin type
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    user_skin_type = profile.skin_type if profile else ""

    # Fetch user's latest screening for concerns
    user_concerns = []
    if not concern:
        latest_screening = db.query(SkinScreening).filter(
            SkinScreening.user_id == current_user.id
        ).order_by(SkinScreening.created_at.desc()).first()

        if latest_screening:
            if latest_screening.primary_concern:
                user_concerns.append(latest_screening.primary_concern)
            if latest_screening.secondary_concern:
                user_concerns.append(latest_screening.secondary_concern)
    else:
        user_concerns = [concern]

    primary_concern = user_concerns[0] if user_concerns else ""

    # ── Try CSV RAG first (primary) ──────────────────────────────────────
    if source in ("auto", "csv"):
        try:
            from app.services.csv_product_rag import csv_product_rag

            csv_results = csv_product_rag.search(
                concern=primary_concern,
                skin_type=user_skin_type,
                max_price=max_price,
                category=category,
                limit=limit,
            )
            if csv_results:
                return {
                    "source": "csv_product_rag",
                    "concern": primary_concern,
                    "skin_type": user_skin_type,
                    "total": len(csv_results),
                    "products": csv_results,
                }
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"CSV RAG failed, falling back to DB: {e}")

    # ── Fallback to DB Recommendation Engine ─────────────────────────────
    if source in ("auto", "db"):
        query = db.query(Product).options(joinedload(Product.ingredients))
        if category and category != "All":
            query = query.filter(Product.product_type == category)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        products = query.all()

        from app.services.recommendation_engine import RecommendationEngine

        results = RecommendationEngine.get_recommendations(
            products=products,
            user_concerns=user_concerns,
            user_skin_type=user_skin_type,
            max_price=max_price,
        )

        return {
            "source": "db_recommendation_engine",
            "concern": primary_concern,
            "skin_type": user_skin_type,
            "total": len(results),
            "products": results,
        }

    return {"source": "none", "products": [], "total": 0}
