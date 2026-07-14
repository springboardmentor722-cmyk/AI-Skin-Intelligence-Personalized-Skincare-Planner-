# source: docs/milestones/milestone_2 (mile_2.docx) Step 3.1 — "In a file named
# scoring_engine.py, write a function utilizing NumPy or standard math libraries to
# execute the exact weighted equation."
"""The Weighted Scoring Model — pure calculation only, no DB/network I/O (the one
exception, `_routine_adherence_score`, only reads through the routines service's own
interface function, per ADR-005; it still does no writes and has no side effects).
`scores/service.py` owns fetching the raw inputs (profile, lifestyle logs, UV
reading, active weights) and persisting the result — this module just turns those
inputs into the five sub-scores and the final weighted Skin Health Score, exactly per
`docs/AI_ML.md` and the mile_2.docx equation:

    Skin Health Score = (S_cond * 0.35) + (L_habits * 0.20) + (S_sleep * 0.15)
                       + (R_consist * 0.20) + (H_hydro * 0.10)
"""

from typing import Any

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.routines import service as routines_service

_HIGH_SEVERITY_DEDUCTION = 15.0
_MEDIUM_SEVERITY_DEDUCTION = 7.0


def _skin_condition_score(concerns: list[Any]) -> float:
    """Milestone 2 Step 3.1's tiered deduction: start at 100, subtract 15 pts per
    High-severity concern (severity_rating 8-10) and 7 pts per Medium (4-7); Low (1-3)
    costs nothing. Missing severity defaults to 5 (Medium), matching the prior
    formula's same default. Concern *identification* itself stays the ADR-007 stub
    (ConcernDetector echoes the profile's declared concerns) — this only changes how
    the declared severities convert into a condition score, per docs/AI_ML.md (updated
    to match)."""
    if not concerns:
        return 100.0
    deduction = 0.0
    for c in concerns:
        severity = c.severity_rating or 5
        if severity >= 8:
            deduction += _HIGH_SEVERITY_DEDUCTION
        elif severity >= 4:
            deduction += _MEDIUM_SEVERITY_DEDUCTION
    return max(0.0, 100.0 - deduction)


_HIGH_UV_INDEX_THRESHOLD = 6.0  # WHO UV Index scale: 0-2 Low, 3-5 Moderate, 6-7 High,
# 8-10 Very High, 11+ Extreme — a real, external standard, not an invented cutoff.
_UNPROTECTED_HIGH_UV_DEDUCTION = 20.0


def _lifestyle_score(logs: list[dict[str, Any]], uv_index: float | None = None) -> float:
    """docs/AI_ML.md names the 4 components (exercise, stress inverted, diet quality,
    sun-exposure hygiene) but not their sub-weights — equal-weighted here, a documented
    assumption (PROGRESS.md), not an invented schema field.

    `uv_index` is Milestone 2 Step 3.1's "high unprotected UV index exposure" signal —
    the real value most recently captured by weather/service.py's OpenUV integration
    for this user (`weather_service.get_latest_uv_index`), not a live fetch triggered
    by score computation itself. `None` when no reading was ever captured (unconfigured
    key, or the user never opened a page with the topbar chip) — behaves identically to
    before this existed, an honest degrade rather than a fabricated reading. When a real
    high UV Index (WHO scale, >=6 "High") coincides with reported sun exposure in the
    most recent log, applies an additional flat deduction — "unprotected" is
    approximated as "spent measurable time outdoors on a real high-UV day" (no
    sunscreen-usage cross-reference exists to know for certain, so this doesn't claim
    to)."""
    if not logs:
        return 50.0
    total = 0.0
    for log in logs:
        exercise = min(100.0, (log.get("exercise_frequency") or 0) / 5 * 100)
        stress = max(0.0, min(100.0, (10 - (log.get("stress_level") or 5)) / 9 * 100))
        diet = max(0.0, min(100.0, (log.get("diet_quality") or 5) / 10 * 100))
        sun_hours = (log.get("environmental_exposure") or {}).get("sun_hours") or 0
        sun_hygiene = max(0.0, 100.0 - sun_hours * 10)
        total += (exercise + stress + diet + sun_hygiene) / 4
    score = total / len(logs)

    latest_sun_hours = (logs[0].get("environmental_exposure") or {}).get("sun_hours") or 0
    if uv_index is not None and uv_index >= _HIGH_UV_INDEX_THRESHOLD and latest_sun_hours > 0:
        score = max(0.0, score - _UNPROTECTED_HIGH_UV_DEDUCTION)
    return score


def _sleep_quality_score(logs: list[dict[str, Any]]) -> float:
    """docs/AI_ML.md: '60% duration score (7-9h band=100, linear falloff) + 40% self-
    rated quality'. Uses the most recent log — a 'today' figure — since the doc gives
    no window for this component (unlike lifestyle's 30-day / hydration's 7-day)."""
    if not logs:
        return 50.0
    latest = logs[0]
    hours = latest.get("sleep_hours")
    if hours is None:
        duration_score = 50.0
    elif 7 <= hours <= 9:
        duration_score = 100.0
    elif hours < 7:
        duration_score = max(0.0, 100.0 - (7 - hours) * 20)
    else:
        duration_score = max(0.0, 100.0 - (hours - 9) * 20)
    quality_score = ((latest.get("sleep_quality") or 5) / 10) * 100
    return 0.6 * duration_score + 0.4 * quality_score


def _hydration_score(logs: list[dict[str, Any]]) -> float:
    """docs/AI_ML.md: 'min(100, glasses/day / 8 * 100), 7-day average'. lifestyle_logs
    stores liters, not glasses — converted via the standard 250ml glass (8 glasses =
    2L/day), not an invented ratio."""
    window = logs[:7]
    if not window:
        return 50.0
    total = sum(min(100.0, ((log.get("water_intake_liters") or 0) / 2.0) * 100) for log in window)
    return total / len(window)


async def _routine_adherence_score(db: AsyncSession, user_id: str) -> float:
    """docs/AI_ML.md: 'completed checklist steps / scheduled steps, trailing 30 days'.
    Real implementation now that routine_logs (Mongo, M2) persists checklist
    completion (routines/service.py's toggle_step_completion) — replaces the ADR-007
    seeded_random stub. No active routine yet, or a routine with no logged days in the
    trailing-30-day window, stays a neutral 50.0 — the same "no data" convention
    _lifestyle_score/_sleep_quality_score/_hydration_score above already use in this
    file, not a punitive 0 or a random guess."""
    step_ids = await routines_service.list_active_step_ids(db, user_id)
    if not step_ids:
        return 50.0
    logs = await routines_service.list_recent_routine_logs(user_id, days=30)
    if not logs:
        return 50.0
    active_step_ids = set(step_ids)
    completed_count = sum(
        1
        for log in logs
        for entry in log.get("completed_steps", [])
        if entry.get("routine_step_id") in active_step_ids
    )
    scheduled = len(step_ids) * len(logs)
    return min(100.0, (completed_count / scheduled) * 100) if scheduled else 50.0


def calculate_skin_health_score(
    *,
    skin_condition: float,
    lifestyle: float,
    sleep_quality: float,
    routine_adherence: float,
    hydration: float,
    skin_condition_weight: float,
    lifestyle_weight: float,
    sleep_quality_weight: float,
    routine_adherence_weight: float,
    hydration_weight: float,
) -> float:
    """The exact weighted equation (mile_2.docx Step 3.1 / docs/AI_ML.md):

        Score = S_cond*0.35 + L_habits*0.20 + S_sleep*0.15 + R_consist*0.20 + H_hydro*0.10

    Weights are passed in (not hard-coded) — `scoring_weights` is a real, versioned
    Postgres table (config-driven scoring, docs/ARCHITECTURE.md §7), not a constant.
    A NumPy dot product, not a plain sum, per the doc's own "utilizing NumPy" tooling
    note — five terms is too small to matter for performance, this is about matching
    the specified tool, not optimizing anything."""
    scores = np.array(
        [skin_condition, lifestyle, sleep_quality, routine_adherence, hydration],
        dtype=float,
    )
    weights = np.array(
        [
            skin_condition_weight,
            lifestyle_weight,
            sleep_quality_weight,
            routine_adherence_weight,
            hydration_weight,
        ],
        dtype=float,
    )
    return float(np.dot(scores, weights))
