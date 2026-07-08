import datetime

from pydantic import BaseModel, ConfigDict


class ScoreWeightsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skin_condition_weight: float
    lifestyle_weight: float
    sleep_quality_weight: float
    routine_adherence_weight: float
    hydration_weight: float


class ScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    score_id: int
    skin_condition_score: float | None
    lifestyle_score: float | None
    sleep_quality_score: float | None
    hydration_score: float | None
    routine_adherence_score: float | None
    overall_score: float | None
    weights: ScoreWeightsRead
    calculated_at: datetime.datetime | None
