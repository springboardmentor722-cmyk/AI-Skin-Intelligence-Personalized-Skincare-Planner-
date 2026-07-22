from typing import Literal

from pydantic import BaseModel, ConfigDict


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    brand_name: str | None
    product_name: str | None
    category: str | None
    image_url: str | None
    price: float | None
    currency: str | None
    spf_rating: int | None
    rating: float | None
    review_count: int | None


class RecommendationRead(BaseModel):
    product: ProductRead
    match_score: float
    reasons: list[str]


class ProductListMeta(BaseModel):
    page: int
    page_size: int
    total: int
    # ES down -> PG ILIKE fallback (M3-C, same pattern as ingredients, milestone_3.md §6).
    source: Literal["elasticsearch", "fallback"]


class ProductListPage(BaseModel):
    items: list[ProductRead]
    meta: ProductListMeta


class ProductIngredientAnnotation(BaseModel):
    ingredient_id: int
    ingredient_name: str
    avoid_flag: bool
    allergy_flag: bool
    reason: str | None


class ProductDetail(BaseModel):
    product_id: int
    brand_name: str | None
    product_name: str | None
    category: str | None
    product_url: str | None
    image_url: str | None
    price: float | None
    currency: str | None
    volume_ml: int | None
    spf_rating: int | None
    rating: float | None
    review_count: int | None
    is_active: bool | None
    ingredients: list[ProductIngredientAnnotation]
    # Aggregate over `ingredients` via the same IngredientSuitability interface M3-B
    # uses per-ingredient (app/ai/suitability.py) — None only when the user has no
    # skin profile yet, not a fabricated default.
    suitable: bool | None
    suitability_confidence: float | None


class ProductCompareItem(BaseModel):
    product: ProductRead
    ingredient_names: list[str]
    skin_types_supported: list[str]
    concerns_supported: list[str]


class ProductCompareRead(BaseModel):
    items: list[ProductCompareItem]


class ProductAlternativesRead(BaseModel):
    alternatives: list[ProductRead]
