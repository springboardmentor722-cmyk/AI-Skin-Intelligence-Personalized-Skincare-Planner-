"""Products & ingredients — Milestone 3, Part 3 (upgraded search).

Search, filtering, sorting and pagination are pushed into SQL rather than done in
Python, so the endpoint stays fast as the catalogue grows from a seed of a dozen
to thousands of imported rows. Every column the queries touch is indexed on the
model (name/brand/category/rating/skin_type_compat/concern_compat/usage_time).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import require
from ..models import Ingredient, Product, ProductIngredient, User
from ..schemas import IngredientOut, ProductOut, ProductPageOut

router = APIRouter(tags=["products"])

SORT_COLUMNS = {
    "name": Product.name,
    "brand": Product.brand,
    "price": Product.price,
    "rating": Product.rating,
    "category": Product.category,
}


def _out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id, name=p.name, brand=p.brand, category=p.category, price=p.price,
        tier=p.tier, suitable_for=p.suitable_for, description=p.description,
        skin_type_compat=p.skin_type_compat, concern_compat=p.concern_compat,
        key_ingredients=p.key_ingredients, ingredient_list=p.ingredient_list,
        ingredient_benefits=p.ingredient_benefits, usage_time=p.usage_time,
        warnings=p.warnings, contraindications=p.contraindications,
        image_url=p.image_url, rating=p.rating, review_count=p.review_count,
        ingredients=[IngredientOut.model_validate(link.ingredient) for link in p.ingredients],
    )


@router.get("/products", response_model=ProductPageOut)
def search_products(
    # --- text search (name / brand / ingredient) ---
    q: str | None = Query(default=None, description="Free text: matches name, brand, description, key ingredients"),
    ingredient: str | None = Query(default=None, description="Filter to products containing this ingredient"),
    # --- structured filters ---
    brand: str | None = None,
    category: str | None = None,
    skin_type: str | None = Query(default=None, description="oily / dry / combination / sensitive / normal"),
    concern: str | None = Query(default=None, description="acne / redness / hyperpigmentation / ..."),
    usage_time: str | None = Query(default=None, description="AM / PM / both"),
    tier: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    min_rating: float | None = Query(default=None, ge=0, le=5),
    # --- sorting & pagination ---
    sort_by: str = Query(default="name", pattern="^(name|brand|price|rating|category)$"),
    order: str = Query(default="asc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    _: User = Depends(require("products.read")),
    db: Session = Depends(get_db),
):
    """Fast, paginated catalogue search across all six requested dimensions."""
    stmt = select(Product)

    # Free-text search across name, brand, description and key ingredients
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(
            func.lower(Product.name).like(like),
            func.lower(func.coalesce(Product.brand, "")).like(like),
            func.lower(func.coalesce(Product.description, "")).like(like),
            func.lower(func.coalesce(Product.key_ingredients, "")).like(like),
        ))

    # Ingredient search — join through the many-to-many table
    if ingredient:
        ing_like = f"%{ingredient.lower()}%"
        stmt = stmt.where(Product.id.in_(
            select(ProductIngredient.product_id)
            .join(Ingredient, Ingredient.id == ProductIngredient.ingredient_id)
            .where(func.lower(Ingredient.name).like(ing_like))
        ))

    if brand:
        stmt = stmt.where(func.lower(Product.brand) == brand.lower())
    if category:
        stmt = stmt.where(func.lower(Product.category) == category.lower())
    if tier:
        stmt = stmt.where(func.lower(Product.tier) == tier.lower())
    if skin_type:
        stmt = stmt.where(or_(
            func.lower(func.coalesce(Product.skin_type_compat, "")).like(f"%{skin_type.lower()}%"),
            func.lower(func.coalesce(Product.suitable_for, "")).like("%all%"),
        ))
    if concern:
        stmt = stmt.where(func.lower(func.coalesce(Product.concern_compat, "")).like(f"%{concern.lower()}%"))
    if usage_time:
        stmt = stmt.where(or_(
            Product.usage_time == usage_time,
            Product.usage_time == "both",
        ))
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)
    if min_rating is not None:
        stmt = stmt.where(Product.rating >= min_rating)

    # total (for pagination) computed in SQL before limit/offset
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    # sorting
    col = SORT_COLUMNS[sort_by]
    stmt = stmt.order_by(col.desc().nulls_last() if order == "desc" else col.asc().nulls_last())

    # pagination + eager-load ingredients to avoid N+1 queries
    stmt = (stmt.options(selectinload(Product.ingredients).selectinload(ProductIngredient.ingredient))
            .offset((page - 1) * page_size).limit(page_size))
    rows = db.scalars(stmt).all()

    total_pages = (total + page_size - 1) // page_size

    return ProductPageOut(
        items=[_out(p) for p in rows],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
        facets=_facets(db),
    )


def _facets(db: Session) -> dict:
    """The distinct values that populate the filter dropdowns on the product page."""
    brands = db.scalars(select(distinct(Product.brand)).where(Product.brand.is_not(None))
                        .order_by(Product.brand)).all()
    categories = db.scalars(select(distinct(Product.category)).where(Product.category.is_not(None))
                            .order_by(Product.category)).all()
    return {
        "brands": brands,
        "categories": categories,
        "skin_types": ["oily", "dry", "combination", "sensitive", "normal"],
        "concerns": ["acne", "redness", "hyperpigmentation", "dark spots",
                     "oiliness", "dry skin", "fine lines", "wrinkles", "sensitive skin"],
        "usage_times": ["AM", "PM", "both"],
    }


@router.get("/products/{product_id}", response_model=ProductOut)
def product_detail(product_id: int, _: User = Depends(require("products.read")),
                   db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return _out(p)


@router.get("/ingredients", response_model=list[IngredientOut])
def list_ingredients(
    q: str | None = Query(default=None, description="Search ingredient name or category"),
    category: str | None = Query(default=None, description="Scientific category"),
    max_comedogenic: int | None = Query(default=None, ge=0, le=5),
    _: User = Depends(require("ingredients.read")),
    db: Session = Depends(get_db),
):
    """The ingredient knowledge base, searchable (Milestone 3, Part 2)."""
    stmt = select(Ingredient)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(
            func.lower(Ingredient.name).like(like),
            func.lower(func.coalesce(Ingredient.scientific_category, "")).like(like),
        ))
    if category:
        stmt = stmt.where(func.lower(func.coalesce(Ingredient.scientific_category, "")) == category.lower())
    if max_comedogenic is not None:
        stmt = stmt.where(Ingredient.comedogenic_rating <= max_comedogenic)
    return db.scalars(stmt.order_by(Ingredient.name)).all()
