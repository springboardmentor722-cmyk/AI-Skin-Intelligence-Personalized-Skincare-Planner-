import datetime
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
    match_percentage: int
    reasons: list[str]
    active_ingredient_tags: list[str]
    over_budget: bool
    alternative_for_product_id: int | None


class RecommendationFeedbackCreate(BaseModel):
    """Mongo `recommendation_feedback` (NEW, M3-D, milestone_3.md §5) — the future
    ranking-label stream (AI_ML.md "Feedback loop"). `recommendation_id` is optional:
    a user can react to a product they saw outside a specific served set (e.g. from
    the catalog), not only from `GET /recommendations/me`."""

    product_id: int
    action: Literal["thumbs_up", "thumbs_down", "saved", "dismissed"]
    recommendation_id: int | None = None


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
    # Populated from product_images (ADR-043) for the catalog subset that has more
    # than one photo (a carousel, web/components/products/product-image-carousel.tsx);
    # empty for every other product, which falls back to the single image_url above.
    image_urls: list[str]
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


class ClientRecommendationRead(BaseModel):
    """ADR-051 — a real `product_recommendations` row, system-served or
    consultant-assigned. `recommended_by_professional_id` is None for the
    former, a real professional user_id for the latter. Built manually by
    service.py (not `.model_validate(row)`) — `product` is resolved via
    resolve_product_read(s), not an ORM relationship on ProductRecommendation."""

    recommendation_id: int
    product: ProductRead
    recommendation_score: float | None
    recommendation_reason: str | None
    recommended_by_professional_id: str | None
    usage_instructions: str | None
    frequency: str | None
    is_active: bool | None
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


class ClientRecommendationCreate(BaseModel):
    product_id: int
    usage_instructions: str | None = None
    frequency: str | None = None
    notes: str | None = None


class ClientRecommendationActiveUpdate(BaseModel):
    is_active: bool


class ClientRecommendationListPageMeta(BaseModel):
    page: int
    page_size: int
    total: int


class ClientRecommendationListPage(BaseModel):
    items: list[ClientRecommendationRead]
    meta: ClientRecommendationListPageMeta
