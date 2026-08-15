"""Product e-store routes — Milestone 3."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import product_controller
from core.database import get_db
from core.dependencies import get_current_user, require_role
from models.user import User
from schemas.product import (
    OrderCreateRequest,
    OrderResponse,
    ProductRecommendationCreate,
    ProductRecommendationResponse,
    ProductResponse,
)
from utils.constants import ROLE_CONSULTANT

router = APIRouter(prefix="/api/products", tags=["Products"])


def _order_to_response(order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        total_amount=float(order.total_amount),
        currency=order.currency,
        status=order.status,
        created_at=order.created_at,
        items=[
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in order.items
        ],
    )


@router.get("", response_model=list[ProductResponse])
def catalog(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The e-store catalog, with items this user's consultant recommended flagged."""
    return product_controller.get_catalog_for_user(db, current_user)


@router.post("/order", response_model=OrderResponse)
def order(
    payload: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Place an order for one or more products (mock checkout — no real payment gateway)."""
    created = product_controller.place_order(db, current_user, payload)
    return _order_to_response(created)


@router.get("/orders/my", response_model=list[OrderResponse])
def my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = product_controller.list_my_orders(db, current_user)
    return [_order_to_response(o) for o in orders]


@router.post(
    "/recommend",
    response_model=ProductRecommendationResponse,
    dependencies=[Depends(require_role(ROLE_CONSULTANT))],
)
def recommend(
    payload: ProductRecommendationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A consultant recommends a product to one of their assigned clients."""
    return product_controller.recommend_product(db, current_user, payload)


@router.get(
    "/recommendations/given",
    response_model=list[ProductRecommendationResponse],
    dependencies=[Depends(require_role(ROLE_CONSULTANT))],
)
def recommendations_given(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return product_controller.list_recommendations_given(db, current_user)
