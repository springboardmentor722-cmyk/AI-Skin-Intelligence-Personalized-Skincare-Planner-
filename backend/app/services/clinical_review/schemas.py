import datetime

from pydantic import BaseModel, ConfigDict

from app.services.routines.schemas import RoutineRead
from app.services.skin_profile.schemas import SkinProfileRead


class ClientScoreRead(BaseModel):
    """A read-only projection of the client's latest real skin_assessments row (via
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
    # real history from skin_assessments via scores_service.get_recent_scores, not a
    # fabricated "AI Confidence" style stat.
    score_trend: list[float]
    last_sync: datetime.datetime | None


class ClientListPageMeta(BaseModel):
    page: int
    page_size: int
    total: int


class ClientListPage(BaseModel):
    """Production-readiness audit finding: list_my_clients had no LIMIT at all —
    every active assignment, unbounded, on every call. A busy professional's real
    client list genuinely grows into the hundreds over time. Same page/page_size/
    total shape as admin/schemas.py's PageMeta-based *Page schemas, kept as its own
    small type here rather than importing across services (ADR-005's own-exposed-
    interface spirit, applied to schemas too, not just models)."""

    items: list[ClientSummaryRead]
    meta: ClientListPageMeta


class ConsultantNoteCreate(BaseModel):
    note_text: str


class ConsultantNoteRead(BaseModel):
    note_id: int
    note_text: str | None
    created_at: datetime.datetime | None
    updated_at: datetime.datetime | None


class ConsultantNoteListPageMeta(BaseModel):
    page: int
    page_size: int
    total: int


class ConsultantNoteListPage(BaseModel):
    """Production-readiness audit finding (round 4): list_notes had no LIMIT
    either — same unbounded-per-relationship shape list_my_clients had, just for
    a client's note history instead of a professional's client roster. Same
    page/page_size/total shape as ClientListPage above, kept separate rather than
    reused since the two wrap different item types."""

    items: list[ConsultantNoteRead]
    meta: ConsultantNoteListPageMeta


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
