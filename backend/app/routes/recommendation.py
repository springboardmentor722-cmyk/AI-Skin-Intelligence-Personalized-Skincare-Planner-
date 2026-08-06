from fastapi import APIRouter, Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas import RoutineCheckRequest
from app.services.routine_service import mark_step_completed
from app.services.routine_service import get_completed_steps

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    SkinProfile,
    Lifestyle,
    SkinAssessment,
)
from app.models import Product, Ingredient
from app.services.recommendation_engine import recommend_products
from app.services.ingredient_matcher import extract_matching_ingredients
from app.services.routine_builder import build_skincare_routine
from app.services.recommendation_storage import save_recommendations
from app.services.recommendation_reader import get_saved_recommendations
from app.models import UserRecommendation

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


@router.get("/")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Get Skin Profile
    skin_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    # Get Lifestyle
    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == current_user.id)
        .first()
    )

    # Get Latest AI Assessment
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    # Get Recommended Products
    # Check saved recommendations
    saved_recommendations = get_saved_recommendations(
    db,
    current_user.id
)

# Generate recommendations only if none exist
    if not saved_recommendations:

        recommended_products = recommend_products(
            db,
            skin_profile,
            latest_assessment,
            lifestyle
    )

        save_recommendations(
            db,
            current_user.id,
            recommended_products
    )

        saved_recommendations = get_saved_recommendations(
            db,
            current_user.id
    )

       # Total Products
    products = db.query(Product).all()

    # ---------- TEST INGREDIENT MATCHER ----------
    # ---------- TEST INGREDIENT MATCHER ----------
   

    return {
    "total_products": len(products),
    "recommended_count": len(saved_recommendations),

    "products": [
        {
            "product_id": item.product.product_id,

            "product_name": item.product.product_name,

            "brand": item.product.brand_name,

            "category": item.product.category,

            "skin_type": item.product.skin_type,

            "skin_concern": item.product.skin_concern,

            "price": item.product.price,

            "rating": item.product.rating,

            "image_url": item.product.image_url,

            "product_url": item.product.product_url,

            "budget": item.budget,

            "product_type": item.product_type,

            "score": item.score,

            "confidence": item.confidence,

            "reason": item.reason.split("\n")
            if item.reason else [],
        }
        for item in saved_recommendations
    ],
}

@router.get("/routine")
def get_routine(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Get Skin Profile
    skin_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == current_user.id)
        .first()
    )

    # Get Lifestyle
    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == current_user.id)
        .first()
    )

    # Get Latest Assessment
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    saved = get_saved_recommendations(
    db,
    current_user.id
)

    recommended_products = []

    for item in saved:
     recommended_products.append(
        {
            "product": item.product,
            "product_type": item.product_type,
            "score": item.score,
            "confidence": item.confidence,
            "budget": item.budget,
            "reason": item.reason.split("\n") if item.reason else [],
        }
    )

    routine = build_skincare_routine(recommended_products)

    completed = get_completed_steps(
       db,
    current_user.id,
)

    return {
    "morning": [
        f"{step.title()} - {product['product_name']}"
        for step, product in routine["morning"].items()
    ],
    "night": [
        f"{step.title()} - {product['product_name']}"
        for step, product in routine["night"].items()
    ],
    "completed": completed,
}

@router.post("/routine/check")
def check_routine_step(
    request: RoutineCheckRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    mark_step_completed(
        db=db,
        user_id=current_user.id,
        routine_time=request.routine_time,   # <-- change this
        step=request.step,
        completed=request.completed,
    )

    return {
        "message": "Routine updated successfully"
    }

@router.get("/details/{recommendation_id}")
def get_recommendation_details(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    recommendation = (
        db.query(UserRecommendation)
        .filter(
            UserRecommendation.id == recommendation_id,
            UserRecommendation.user_id == current_user.id,
        )
        .first()
    )

    if not recommendation:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found."
        )

    product = recommendation.product

    return {

    "recommendation_id": recommendation.id,

    "product_id": product.product_id,

    "product_name": product.product_name,

    "brand": product.brand_name,

    "category": product.category,

    "skin_type": product.skin_type,

    "skin_concern": product.skin_concern,

    "description": product.description,

    "usage": product.usage,

    "ingredients": product.ingredients,

    "price": product.price,

    "rating": product.rating,

    "image_url": product.image_url,

    "product_url": product.product_url,

    "product_type": recommendation.product_type,

    "score": recommendation.score,

    "confidence": recommendation.confidence,

    "budget": recommendation.budget,

    "reason": recommendation.reason.split("\n")
    if recommendation.reason else [],
}

