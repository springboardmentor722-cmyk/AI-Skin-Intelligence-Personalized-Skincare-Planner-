import datetime

from pydantic import BaseModel, ConfigDict

from app.services.routines.schemas import RoutineRead
from app.services.skin_profile.schemas import SkinProfileRead


class ClientScoreRead(BaseModel):
    """A read-only projection of the client's latest real skin_scores row (via
    scores_service.get_recent_scores) — never recomputed on a professional's
    behalf. Deliberately doesn't reuse scores/schemas.py's ScoreRead: that schema
    requires the nested scoring_weights row, which isn't needed for a clinical
    review view of the five component scores + overall."""

    model_config = ConfigDict(from_attributes=True)

    score_id: int
    skin_condition_score: float | None
    lifestyle_score: float | None
    sleep_quality_score: float | None
    hydration_score: float | None
    routine_adherence_score: float | None
    overall_score: float | None
    calculated_at: datetime.datetime | None


class ClientSummaryRead(BaseModel):
    user_id: str
    name: str | None
    email: str
    skin_type_name: str | None
    primary_concern_name: str | None
    overall_score: float | None
    routine_adherence_score: float | None
    # Trailing overall_score history (oldest -> newest), for a trend sparkline —
    # real history from skin_scores via scores_service.get_recent_scores, not a
    # fabricated "AI Confidence" style stat.
    score_trend: list[float]
    last_sync: datetime.datetime | None


class ConsultantNoteCreate(BaseModel):
    note_text: str


class ConsultantNoteRead(BaseModel):
    note_id: int
    note_text: str | None
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


class ClientDetailRead(BaseModel):
    user_id: str
    name: str | None
    email: str
    # None if the client's assignment is real but they haven't completed the
    # assessment wizard yet — a legitimate state, not an error (the assignment
    # itself is still valid).
    skin_profile: SkinProfileRead | None
    score: ClientScoreRead | None
    routines: list[RoutineRead]
    notes: list[ConsultantNoteRead]
