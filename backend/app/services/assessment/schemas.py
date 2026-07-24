from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.services.scores.schemas import ScoreRead

# Milestone 2 P9 (MILESTONE 2.docx "3. How the Payload Sends to the Backend") — the
# doc's literal sun_exposure enum, verbatim casing.
SunExposure = Literal["None", "Low", "Moderate", "High"]

# The 10 deprecated flat severity fields (ADR-021 C4) — one per seeded
# `skin_concerns.concern_name` run through `concern_name_to_severity_field`
# (mechanical transform, confirmed live against the seed data, see that function's
# own docstring). Kept as a plain tuple, not derived from a DB query at import
# time, so this module has no import-time DB dependency.
FLAT_SEVERITY_FIELDS: tuple[str, ...] = (
    "acne_severity",
    "hyperpigmentation_severity",
    "dark_spots_severity",
    "dry_skin_severity",
    "oily_skin_severity",
    "sensitive_skin_severity",
    "wrinkles_severity",
    "fine_lines_severity",
    "redness_severity",
    "uneven_skin_tone_severity",
)


class AssessmentConcernInput(BaseModel):
    """Canonical concern entry (ADR-021 C4) — `id` matches a real
    `skin_concerns.concern_id`, validated against the seeded table in the service
    layer (a Pydantic-level enum can't express a lookup-table membership check)."""

    id: int
    severity: int = Field(ge=0, le=10)


class AssessmentLifestyleInput(BaseModel):
    sleep_hours: float = Field(ge=0, le=24)
    water_intake_liters: float = Field(ge=0, le=10)
    stress_level: int = Field(ge=1, le=10)
    sun_exposure: SunExposure


class AssessmentSubmitRequest(BaseModel):
    """Matches the P0-frozen contract exactly (docs/milestones/milestone_2/
    M2_TASK_LEDGER.md M2-P08-T02, unit-tested in web/lib/__tests__/
    assessment-payload.test.ts against the same worked example this backend's own
    pytest suite uses). `skin_type` is validated against the real seeded
    `skin_types.skin_type_name` values in the service layer, not a hardcoded
    Literal — skin types are a lookup table, not a true enum (ADR-021 C1 added
    "Normal" to the doc's original 4)."""

    skin_type: str
    lifestyle: AssessmentLifestyleInput
    concerns: list[AssessmentConcernInput] = Field(default_factory=list)

    # Deprecated flat fields (ADR-021 C4) — accepted for doc-literal backward
    # compatibility. When `concerns` is empty, the service adapts these into
    # concerns[] itself (a caller using ONLY the docx's literal shape still works).
    acne_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    hyperpigmentation_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    dark_spots_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    dry_skin_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    oily_skin_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    sensitive_skin_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    wrinkles_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    fine_lines_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    redness_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)
    uneven_skin_tone_severity: int | None = Field(default=None, ge=0, le=10, deprecated=True)


class PrioritizedConcernRead(BaseModel):
    concern_id: int
    severity: int
    rank: int


class RiskFactorRead(BaseModel):
    key: str
    label: str
    description: str


class AssessmentSubmitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # The id GET /api/v1/assessment/score/{id} (P10) is called with — the computed
    # SkinScore row's own score_id, not the raw-submission row's id.
    assessment_id: int
    submission_id: int
    prioritized_concerns: list[PrioritizedConcernRead]
    risk_factors: list[RiskFactorRead]
    score: ScoreRead
