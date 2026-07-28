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
    # Milestone 2 P14 (ADR-024's "materially narrower than UI_SPEC's roster
    # columns" gap) — both real, both backed by user_profiles' own columns
    # (date_of_birth/gender, user_service.get_or_create_profile), not invented.
    # `age` is None when date_of_birth was never set, same "honest can't-compute"
    # spirit as ScoreRead.skin_age.
    age: int | None
    gender: str | None
    skin_type_name: str | None
    primary_concern_name: str | None
    overall_score: float | None
    routine_adherence_score: float | None
    # Trailing overall_score history (oldest -> newest), for a trend sparkline —
    # real history from skin_assessments via scores_service.get_recent_scores, not a
    # fabricated "AI Confidence" style stat.
    score_trend: list[float]
    last_sync: datetime.datetime | None
    # M3R Phase 5 — the rubric's "compliance metrics (7/30-day)", wired straight from
    # progress_service.get_compliance_percentages (already built, M3-E) rather than
    # recomputed here. Same honest-None convention as that function's own fields:
    # None when nothing was ever assigned in that window, never a fabricated 0%.
    compliance_seven_day: float | None
    compliance_thirty_day: float | None


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


class PortfolioDistributionSlice(BaseModel):
    key: str
    label: str
    count: int


class PortfolioRecentAssessment(BaseModel):
    user_id: str
    name: str | None
    overall_score: float | None
    calculated_at: datetime.datetime | None


class ClinicalPortfolioStatsRead(BaseModel):
    """Milestone 2 P14 (ADR-024's deferred consequence, ADR-031's naming
    precedent) — the real, computed replacement for
    web/lib/fixtures/clinical-dashboard-fixtures.ts's KPI/donut/bars/trend/
    stat-footer/recent-assessments blocks, aggregated once across a
    professional's whole active roster (not paginated — a portfolio-wide stat,
    unlike ClientListPage). `total_assigned` doubles as ClientListPage.meta.total
    would, so a caller with only this response still knows the roster size.
    No `upcoming_follow_ups` field: no scheduling/appointment concept exists
    anywhere in database_schemas/ — fabricating one was explicitly out of scope
    (AGENTS.md §0.2), the fixture's "Upcoming Follow-ups" card and 5th KPI have
    no real replacement and are dropped by the frontend, not silently renamed."""

    total_assigned: int
    assessments_done: int
    active_routines: int
    # None when no assigned client has 2+ score points yet to average a delta from.
    avg_improvement_points: float | None
    clients_improving: int
    clients_stable: int
    clients_need_attention: int
    skin_type_distribution: list[PortfolioDistributionSlice]
    top_concerns: list[PortfolioDistributionSlice]
    # Point-indexed (1st assessment, 2nd, ...), not calendar-week-bucketed — a
    # deliberate simplification (real assigned clients rarely share assessment
    # dates), documented in docs/DECISIONS.md's P14 ADR.
    portfolio_score_trend: list[float]
    recent_assessments: list[PortfolioRecentAssessment]


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
