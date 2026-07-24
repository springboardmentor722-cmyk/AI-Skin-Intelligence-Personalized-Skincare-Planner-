import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.outbox import append_outbox
from app.services.assessment.models import AssessmentSubmission
from app.services.assessment.schemas import (
    FLAT_SEVERITY_FIELDS,
    AssessmentConcernInput,
    AssessmentLifestyleInput,
    AssessmentSubmitRequest,
    AssessmentSubmitResponse,
    PrioritizedConcernRead,
    RiskFactorRead,
    SunExposure,
)
from app.services.scores import service as scores_service
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.schemas import (
    EnvironmentalExposure,
    LifestyleLogCreate,
    SkinProfileConcernInput,
    SkinProfileCreate,
)

# Milestone 2 P9 (MILESTONE 2.docx "3. How the Payload Sends to the Backend" +
# "4. Core Backend API Endpoints"). Concern identification/prioritisation/risk-factor
# analysis (mile_2.docx §3) as pure functions — no DB access, fully unit-testable —
# called by submit_assessment below.


class AssessmentValidationError(Exception):
    """Field-level validation failure the router turns into a 422 — mirrors
    FastAPI's own RequestValidationError body shape (list of {loc, msg, type})
    so every validation failure in this API looks the same to a client, whether
    Pydantic or this service layer caught it."""

    def __init__(self, errors: list[dict[str, Any]]) -> None:
        self.errors = errors
        super().__init__("Assessment validation failed")


def concern_name_to_severity_field(concern_name: str) -> str:
    """Mechanical transform, not a lookup table — mirrors web/lib/assessment/
    datasets.ts's severityFieldForConcernName exactly. Confirmed against the live
    seeded skin_concerns table this session: every one of the 10 names produces
    the same field name web/lib/assessment/skin-concerns.json already uses."""
    return f"{concern_name.lower().replace(' ', '_')}_severity"


# Representative hours per category (docs/DECISIONS.md-style documented
# approximation, not a measured value) — mirrors the wizard's own former
# SUN_EXPOSURE_TO_HOURS mapping (web/lib/assessment/save.ts, removed at P8 once the
# wizard stopped writing lifestyle_logs directly; the conversion now lives here
# since this endpoint is what performs that write).
_SUN_EXPOSURE_TO_HOURS: dict[SunExposure, float] = {
    "None": 0.0,
    "Low": 1.0,
    "Moderate": 3.0,
    "High": 5.0,
}


def prioritize_concerns(concerns: list[AssessmentConcernInput]) -> list[AssessmentConcernInput]:
    """mile_2.docx §3: 'Sort and flag these concerns by severity... if a user
    selects both Acne and Wrinkles, but ranks acne as an active flare-up,
    prioritize Acne.' Ranked by severity descending; ties broken by the concern's
    original position in the submitted list (Python's sort is stable) — the
    earlier-selected of two equally-severe concerns is treated as primary, since
    selection order is the only signal of relative intent this payload carries."""
    return sorted(concerns, key=lambda c: c.severity, reverse=True)


def derive_risk_factors(lifestyle: AssessmentLifestyleInput) -> list[RiskFactorRead]:
    """mile_2.docx §3's 'risk factor analysis' — thresholds documented here, not
    invented per-call. Order matches the fields' own order in the request."""
    risks: list[RiskFactorRead] = []
    if lifestyle.sleep_hours < 6:
        risks.append(
            RiskFactorRead(
                key="sleep_deficit",
                label="Sleep deficit",
                description="Under 6 hours of reported sleep — a real driver of barrier"
                " dysfunction and slower recovery.",
            )
        )
    if lifestyle.water_intake_liters < 2.0:
        risks.append(
            RiskFactorRead(
                key="dehydration_risk",
                label="Low hydration",
                description="Under 2L of reported daily water intake.",
            )
        )
    if lifestyle.stress_level >= 7:
        risks.append(
            RiskFactorRead(
                key="high_stress",
                label="Elevated stress",
                description="Self-reported stress level of 7/10 or higher.",
            )
        )
    if lifestyle.sun_exposure in ("Moderate", "High"):
        risks.append(
            RiskFactorRead(
                key="uv_exposure",
                label="UV exposure",
                description=f"Reported sun exposure: {lifestyle.sun_exposure}.",
            )
        )
    return risks


async def submit_assessment(
    db: AsyncSession, user_id: str, payload: AssessmentSubmitRequest
) -> AssessmentSubmitResponse:
    errors: list[dict[str, Any]] = []

    skin_types = await skin_profile_service.list_skin_types(db)
    skin_type = next((t for t in skin_types if t.skin_type_name == payload.skin_type), None)
    if skin_type is None:
        errors.append(
            {
                "loc": ["body", "skin_type"],
                "msg": f"Unknown skin_type {payload.skin_type!r}",
                "type": "value_error",
            }
        )

    known_concerns = await skin_profile_service.list_skin_concerns(db)
    # concern_name is nullable at the type level only (unique seed data, always
    # populated in practice) — skip any that somehow aren't rather than crash.
    by_field = {
        concern_name_to_severity_field(c.concern_name): c
        for c in known_concerns
        if c.concern_name is not None
    }
    known_ids = {c.concern_id for c in known_concerns}

    if payload.concerns:
        concerns = payload.concerns
        unknown_ids = sorted({c.id for c in concerns} - known_ids)
        for bad_id in unknown_ids:
            errors.append(
                {
                    "loc": ["body", "concerns"],
                    "msg": f"Unknown concern id {bad_id}",
                    "type": "value_error",
                }
            )
    else:
        # Flat-field adapter (ADR-021 C4) — resolve each reported field to its
        # real concern_id via the same field-name transform. `model_dump()`, not
        # `getattr`: these fields are `deprecated=True` for OpenAPI's benefit, and
        # attribute access on a deprecated Pydantic field emits a real
        # DeprecationWarning on every call — expected here (this adapter's whole
        # job is reading them), not a signal to fix.
        payload_dict = payload.model_dump()
        concerns = []
        for field in FLAT_SEVERITY_FIELDS:
            severity = payload_dict[field]
            if not severity:
                continue
            concern = by_field.get(field)
            if concern is None:
                # A field name that doesn't map to any seeded concern — can only
                # happen if the seed data and FLAT_SEVERITY_FIELDS have drifted.
                errors.append(
                    {
                        "loc": ["body", field],
                        "msg": f"No seeded concern maps to {field!r}",
                        "type": "value_error",
                    }
                )
                continue
            concerns.append(AssessmentConcernInput(id=concern.concern_id, severity=severity))

    if errors:
        raise AssessmentValidationError(errors)

    prioritized = prioritize_concerns(concerns)
    risk_factors = derive_risk_factors(payload.lifestyle)

    # Sync the real, versioned skin profile (Skin Profile service owns this write,
    # AGENTS.md §2 rule 4 single-writer) — severity 0 isn't a real selection, so it
    # never reaches SkinProfileConcernInput (whose severity_rating is 1-10).
    profile_concerns = [
        SkinProfileConcernInput(
            concern_id=c.id,
            severity_rating=c.severity,
            priority_level=max(1, 10 - rank),
        )
        for rank, c in enumerate(prioritized)
        if c.severity >= 1
    ]
    assert skin_type is not None  # errors would have raised above otherwise
    await skin_profile_service.create_profile(
        db,
        user_id,
        SkinProfileCreate(skin_type_id=skin_type.skin_type_id, concerns=profile_concerns),
    )

    await skin_profile_service.upsert_lifestyle_log(
        user_id,
        LifestyleLogCreate(
            log_date=datetime.date.today(),
            sleep_hours=payload.lifestyle.sleep_hours,
            water_intake_liters=payload.lifestyle.water_intake_liters,
            stress_level=payload.lifestyle.stress_level,
            environmental_exposure=EnvironmentalExposure(
                sun_hours=_SUN_EXPOSURE_TO_HOURS[payload.lifestyle.sun_exposure]
            ),
        ),
    )

    score = await scores_service.compute_and_store_score(db, user_id)

    submission = AssessmentSubmission(
        user_id=user_id,
        schema_version=1,
        raw_payload=payload.model_dump(mode="json"),
        score_id=score.score_id,
    )
    db.add(submission)
    await append_outbox(db, "assessment", user_id, "submitted", {"score_id": score.score_id})
    await db.commit()
    await db.refresh(submission)

    return AssessmentSubmitResponse(
        assessment_id=score.score_id,
        submission_id=submission.submission_id,
        prioritized_concerns=[
            PrioritizedConcernRead(concern_id=c.id, severity=c.severity, rank=i + 1)
            for i, c in enumerate(prioritized)
        ],
        risk_factors=risk_factors,
        score=score,
    )
