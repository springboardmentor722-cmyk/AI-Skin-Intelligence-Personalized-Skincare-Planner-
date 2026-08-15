"""
Seed script — creates the four roles, one demo account per role, the
product catalog, and the ingredient knowledge base, if they do not
already exist. Called automatically from main.py on startup.
"""

import logging

from core.database import SessionLocal
from core.security import hash_password
from models.ingredient import Ingredient, IngredientConflict
from models.product import Product
from models.role import Role
from models.user import User
from utils.constants import (
    ALL_ROLES,
    SEED_ACCOUNTS,
    SEED_INGREDIENT_CONFLICTS,
    SEED_INGREDIENTS,
    SEED_PRODUCTS,
)

logger = logging.getLogger("app.seed")


def seed_roles(db) -> None:
    for role_name in ALL_ROLES:
        exists = db.query(Role).filter(Role.name == role_name).first()
        if not exists:
            db.add(Role(name=role_name, description=f"{role_name} role"))
    db.commit()


def seed_demo_accounts(db) -> None:
    for account in SEED_ACCOUNTS:
        exists = db.query(User).filter(User.email == account["email"]).first()
        if exists:
            continue

        role = db.query(Role).filter(Role.name == account["role"]).first()
        if not role:
            continue

        user = User(
            full_name=account["full_name"],
            email=account["email"],
            phone_number=account["phone_number"],
            hashed_password=hash_password(account["password"]),
            role_id=role.id,
            terms_accepted=True,
        )
        db.add(user)
    db.commit()


def seed_ingredients(db) -> dict:
    """
    Seed the ingredient knowledge base and chemical conflict matrix
    (Milestone 3, Step 1). Returns {category_name: Ingredient} for
    seed_products() to link against.
    """
    by_category = {}
    for item in SEED_INGREDIENTS:
        existing = db.query(Ingredient).filter(Ingredient.name == item["name"]).first()
        if not existing:
            existing = Ingredient(
                name=item["name"],
                category=item["category"],
                aliases=item["aliases"],
                irritation_risk=item["irritation_risk"],
                description=item.get("description"),
            )
            db.add(existing)
            db.flush()
        by_category[item["category"]] = existing
    db.commit()

    if db.query(IngredientConflict).count() == 0:
        for rule in SEED_INGREDIENT_CONFLICTS:
            db.add(
                IngredientConflict(
                    category_a=rule["category_a"],
                    category_b=rule["category_b"],
                    severity=rule["severity"],
                    reason=rule["reason"],
                )
            )
        db.commit()

    return by_category


def seed_products(db, ingredients_by_category: dict) -> None:
    """One-time seed of the product e-store catalog, linked to the ingredient knowledge base."""
    if db.query(Product).count() > 0:
        return
    for item in SEED_PRODUCTS:
        product = Product(
            name=item["name"],
            brand=item["brand"],
            category=item["category"],
            description=item.get("description"),
            price=item["price"],
            currency="INR",
            rating=item["rating"],
            review_count=item["review_count"],
            concern_tags=item.get("concern_tags", []),
            skin_type_tags=item.get("skin_type_tags", []),
            is_active=True,
        )
        for category_name in item.get("ingredients", []):
            ingredient = ingredients_by_category.get(category_name)
            if ingredient:
                product.ingredients.append(ingredient)
        db.add(product)
    db.commit()


def run_seed() -> None:
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_demo_accounts(db)
        ingredients_by_category = seed_ingredients(db)
        seed_products(db, ingredients_by_category)
        logger.info("Seed data verified/created successfully.")
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.error("Seeding failed: %s", exc)
    finally:
        db.close()
