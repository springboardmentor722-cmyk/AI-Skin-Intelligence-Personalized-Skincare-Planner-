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
    # Milestone 2 P10 (decision C6) — None when the profile has no age_group set
    # yet (Skin Age isn't derivable without a real age input, so this is an honest
    # "can't compute", not a guess).
    skin_age: float | None = None
    # Good/Fair/Poor — the same ramp web/lib/score-components.ts's SCORE_BANDS
    # uses (>=75 Good, >=60 Fair, else Poor). None only when overall_score itself
    # is None (no score computed yet).
    band: str | None = None
    weights: ScoreWeightsRead
    calculated_at: datetime.datetime | None
