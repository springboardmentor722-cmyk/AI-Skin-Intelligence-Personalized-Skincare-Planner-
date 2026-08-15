"""Pydantic schemas for the Product Recommendation Engine — Milestone 3."""

import uuid
from typing import Optional

from pydantic import BaseModel


class RecommendedProduct(BaseModel):
    id: uuid.UUID
    name: str
    brand: str
    category: str
    price: float
    currency: str
    rating: float
    match_percentage: float
    ingredient_tags: list[str]
    within_budget: bool
    alternative_to: Optional[str] = None


class RecommendationResponse(BaseModel):
    categories: dict[str, list[RecommendedProduct]]
    excluded_count: int
