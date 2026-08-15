"""Product controller — Milestone 3."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.user import User
from schemas.product import OrderCreateRequest, ProductRecommendationCreate
from services import booking_service, notification_service, product_service


def get_catalog_for_user(db: Session, user: User):
    """Full product catalog, each item flagged if a consultant recommended it to this user."""
    products = product_service.list_active_products(db)
    recommended_ids = product_service.get_recommended_product_ids_for_client(db, user.id)

    results = []
    for p in products:
        results.append(
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "description": p.description,
                "price": float(p.price),
                "currency": p.currency,
                "rating": float(p.rating),
                "review_count": p.review_count,
                "is_recommended_for_you": str(p.id) in recommended_ids,
            }
        )
    return results


def recommend_product(db: Session, consultant: User, payload: ProductRecommendationCreate):
    if not booking_service.is_client_assigned_to_consultant(db, consultant.id, payload.client_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This client isn't assigned to you.",
        )

    product = product_service.get_product(db, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    recommendation = product_service.create_recommendation(
        db, consultant.id, payload.client_id, payload.product_id, payload.note
    )

    notification_service.create_notification(
        db,
        payload.client_id,
        "recommendation",
        "New product recommendation",
        f"{consultant.full_name} recommended {product.brand} — {product.name} for you.",
        link_to="/store",
    )

    return recommendation


def list_recommendations_given(db: Session, consultant: User):
    return product_service.list_recommendations_by_consultant(db, consultant.id)


def place_order(db: Session, user: User, payload: OrderCreateRequest):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must include at least one item")
    return product_service.create_order(db, user.id, payload)


def list_my_orders(db: Session, user: User):
    return product_service.list_orders_for_user(db, user.id)
