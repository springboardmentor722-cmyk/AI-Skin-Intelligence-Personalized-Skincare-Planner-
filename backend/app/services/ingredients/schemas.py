import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.services.recommendations.schemas import ProductRead


class IngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingredient_id: int
    ingredient_name: str
    inci_name: str | None
    category: str | None
    is_active: bool | None
    created_at: datetime.datetime | None


class IngredientListMeta(BaseModel):
    page: int
    page_size: int
    total: int
    # ES down -> PG ILIKE fallback (M3-B) — surfaced in the envelope, never silent
    # (milestone_3.md §6 "Response formats").
    source: Literal["elasticsearch", "fallback"]


class IngredientListPage(BaseModel):
    items: list[IngredientRead]
    meta: IngredientListMeta


class ConcernTreated(BaseModel):
    concern_id: int
    concern_name: str | None
    evidence_strength: str | None


class AvoidForSkinType(BaseModel):
    skin_type_id: int
    skin_type_name: str | None
    reason: str | None


class EducationSnippet(BaseModel):
    article_id: int
    title: str | None
    summary: str | None
    source: str | None


class IngredientDetail(BaseModel):
    ingredient_id: int
    ingredient_name: str
    inci_name: str | None
    category: str | None
    is_active: bool | None
    treats_concerns: list[ConcernTreated]
    avoid_for_skin_types: list[AvoidForSkinType]
    products: list[ProductRead]
    education: list[EducationSnippet]


class SuitabilityRead(BaseModel):
    ingredient_id: int
    suitable: bool
    confidence: float
    reasons: list[str]
    allergy_flag: bool
    avoid_flag: bool


class InteractionPair(BaseModel):
    ingredient_id_a: int
    ingredient_id_b: int
    ingredient_name_a: str
    ingredient_name_b: str
    verdict: Literal["avoid", "caution", "synergy", "unknown"]
    reason: str | None


class InteractionsRead(BaseModel):
    pairs: list[InteractionPair]


class SafetyScoreRequest(BaseModel):
    ingredient_ids: list[int]
    routine_time: Literal["AM", "PM"]


class AllergyAlert(BaseModel):
    ingredient_id: int
    ingredient_name: str
    reason: str
    confidence: float


class InteractionWarning(BaseModel):
    ingredient_id_a: int
    ingredient_id_b: int
    ingredient_name_a: str
    ingredient_name_b: str
    verdict: Literal["avoid", "caution"]
    reason: str | None


class SafetyScoreRead(BaseModel):
    score: int
    label: Literal["Safe", "Warning", "Unsafe"]
    confidence: float
    allergy_alerts: list[AllergyAlert]
    interaction_warnings: list[InteractionWarning]
