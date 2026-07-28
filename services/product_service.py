"""Database logic for the product e-store — Milestone 3."""

import uuid

from sqlalchemy.orm import Session

from models.product import Order, OrderItem, Product, ProductRecommendation
from schemas.product import OrderCreateRequest


def list_active_products(db: Session, category: str | None = None) -> list[Product]:
    query = db.query(Product).filter(Product.is_active.is_(True))
    if category:
        query = query.filter(Product.category == category)
    return query.order_by(Product.category, Product.name).all()


def get_product(db: Session, product_id: uuid.UUID) -> Product | None:
    return db.query(Product).filter(Product.id == product_id, Product.is_active.is_(True)).first()


def get_recommended_product_ids_for_client(db: Session, client_id: uuid.UUID) -> set[str]:
    rows = (
        db.query(ProductRecommendation.product_id)
        .filter(ProductRecommendation.client_id == client_id)
        .all()
    )
    return {str(row[0]) for row in rows}


def create_recommendation(
    db: Session, consultant_id: uuid.UUID, client_id: uuid.UUID, product_id: uuid.UUID, note: str | None
) -> ProductRecommendation:
    rec = ProductRecommendation(
        consultant_id=consultant_id, client_id=client_id, product_id=product_id, note=note
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def list_recommendations_for_client(db: Session, client_id: uuid.UUID) -> list[ProductRecommendation]:
    return (
        db.query(ProductRecommendation)
        .filter(ProductRecommendation.client_id == client_id)
        .order_by(ProductRecommendation.created_at.desc())
        .all()
    )


def list_recommendations_by_consultant(db: Session, consultant_id: uuid.UUID) -> list[ProductRecommendation]:
    return (
        db.query(ProductRecommendation)
        .filter(ProductRecommendation.consultant_id == consultant_id)
        .order_by(ProductRecommendation.created_at.desc())
        .all()
    )


def create_order(db: Session, user_id: uuid.UUID, payload: OrderCreateRequest) -> Order:
    products_by_id = {}
    total = 0.0
    for item in payload.items:
        product = get_product(db, item.product_id)
        if product is None:
            continue
        products_by_id[str(item.product_id)] = product
        total += float(product.price) * item.quantity

    order = Order(user_id=user_id, total_amount=round(total, 2), status="Placed")
    db.add(order)
    db.flush()  # get order.id before creating items

    for item in payload.items:
        product = products_by_id.get(str(item.product_id))
        if product is None:
            continue
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
            )
        )

    db.commit()
    db.refresh(order)
    return order


def list_orders_for_user(db: Session, user_id: uuid.UUID) -> list[Order]:
    return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
