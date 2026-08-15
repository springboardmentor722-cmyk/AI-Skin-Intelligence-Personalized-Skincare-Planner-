"""Pydantic schemas for the Ingredient Intelligence Engine — Milestone 3."""

import uuid
from typing import Optional

from pydantic import BaseModel, Field


class SafetyCheckRequest(BaseModel):
    """
    Either pass a `product_id` (checked against the catalog's linked
    ingredients) or a raw `ingredient_categories` list (e.g. when checking
    a hypothetical combination before it's a saved routine step).
    """

    product_id: Optional[uuid.UUID] = None
    ingredient_categories: list[str] = Field(default_factory=list)
    time_of_day: Optional[str] = Field(None, description="AM, PM, or Weekly — informational only")


class AllergyAlert(BaseModel):
    ingredient: str
    category: str
    matched_allergy_term: str


class ConflictWarning(BaseModel):
    category_a: str
    category_b: str
    severity: str
    reason: str


class SafetyCheckResponse(BaseModel):
    safety_score: int
    status: str  # Safe, Warning, Unsafe
    allergy_alerts: list[AllergyAlert]
    conflict_warnings: list[ConflictWarning]
    categories_checked: list[str]


class IngredientResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    irritation_risk: str
    aliases: list[str]
    description: Optional[str] = None

    class Config:
        from_attributes = True
