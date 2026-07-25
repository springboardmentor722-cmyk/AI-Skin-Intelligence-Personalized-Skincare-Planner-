# source: docs/milestones/milestone_2 (MILESTONE 2.docx) §"2. Weighted Skin Health
# Scoring Engine" — "In a file named scoring_engine.py, write a function utilizing
# NumPy or standard math libraries to execute the exact weighted equation."
"""The Weighted Scoring Model — pure calculation only, no DB/network I/O, no clock
reads, deterministic (Milestone 2 P10's own guardrail: same input, same output,
always). `scores/service.py` owns fetching the raw inputs (profile, lifestyle logs,
routine step ids + logs, UV reading, active weights) and persisting the result —
this module only turns already-fetched inputs into the five sub-scores, Skin Age,
and the final weighted Skin Health Score:

    Skin Health Score = 0.35(C) + 0.20(L) + 0.15(S) + 0.20(A) + 0.10(H)

Every weight/benchmark/threshold lives in `scores/constants.py` — no numeric
literal for one appears in this file.
"""

from typing import Any

import numpy as np

from app.services.scores import constants

# web/lib/assessment/skin-concerns.json ships two pairs of concern cards that are
# the same underlying skin_concerns row split into a broad and a narrow card
# (Hyperpigmentation "Dark Spots & Pigmentation" / Dark Spots "Dark Marks", Wrinkles
# "Fine Lines & Wrinkles" / Fine Lines "Fine Lines") — a user ticking both at high
# severity was double-deducted for one condition. Collapsed to a single group here
# so only the highest severity in the pair counts.
_CONCERN_SYNONYM_GROUPS: dict[str, str] = {
    "Hyperpigmentation": "tone_dark_marks",
    "Dark Spots": "tone_dark_marks",
    "Wrinkles": "aging_lines",
    "Fine Lines": "aging_lines",
}


def _skin_condition_score(concerns: list[Any]) -> float:
    """C — Condition (35%): "penalised by the total severity of the user's skin
    concerns". Tiered deduction: start at 100, subtract
    `CONDITION_HIGH_SEVERITY_DEDUCTION` per High-severity concern
    (severity_rating >= `CONDITION_HIGH_SEVERITY_MIN`) and
    `CONDITION_MEDIUM_SEVERITY_DEDUCTION` per Medium
    (>= `CONDITION_MEDIUM_SEVERITY_MIN`); Low costs nothing. Missing severity
    defaults to `CONDITION_DEFAULT_SEVERITY_WHEN_MISSING` (Medium). Concern
    *identification* itself stays the ADR-007 stub (ConcernDetector echoes the
    profile's declared concerns) — this only converts declared severities into a
    condition score.

    Concerns in the same `_CONCERN_SYNONYM_GROUPS` group collapse to their single
    highest severity before deduction. A concern with no `concern_name` (or one not
    in the map — every other seeded concern is its own group) is keyed by its list
    position, not object identity — the same concern row can legitimately appear
    more than once (e.g. re-submitted across assessments) and must still be
    deducted once per occurrence, not merged just because it's the same object.

    ADR-034: for total deduction <= 100 this is exactly the docx's formula, no
    exceptions — every deduction <= 100 returns bit-for-bit `100.0 - deduction`.
    Past 100 (unspecified by the docx; previously a flat clamp to 0, so 7+
    simultaneous High-severity concerns were all indistinguishable) the score
    instead decays from `CONDITION_SATURATION_TAIL_SCALE` toward, but never
    reaching, 0 — worse keeps meaning worse, all the way down."""
    if not concerns:
        return 100.0
    highest_severity_per_group: dict[object, int] = {}
    for index, c in enumerate(concerns):
        severity = c.severity_rating or constants.CONDITION_DEFAULT_SEVERITY_WHEN_MISSING
        name = getattr(c, "concern_name", None)
        group_key = _CONCERN_SYNONYM_GROUPS.get(name, index) if name else index
        if severity > highest_severity_per_group.get(group_key, -1):
            highest_severity_per_group[group_key] = severity

    deduction = 0.0
    for severity in highest_severity_per_group.values():
        if severity >= constants.CONDITION_HIGH_SEVERITY_MIN:
            deduction += constants.CONDITION_HIGH_SEVERITY_DEDUCTION
        elif severity >= constants.CONDITION_MEDIUM_SEVERITY_MIN:
            deduction += constants.CONDITION_MEDIUM_SEVERITY_DEDUCTION

    if deduction <= 100.0:
        return 100.0 - deduction
    overflow = deduction - 100.0
    tail_scale = constants.CONDITION_SATURATION_TAIL_SCALE
    return float(tail_scale * np.exp(-overflow / tail_scale))


def _lifestyle_score(logs: list[dict[str, Any]], uv_index: float | None = None) -> float:
    """L — Lifestyle (20%): "evaluated against daily stress level and sun exposure
    risk". docs/AI_ML.md names 4 equal-weighted components (exercise, stress
    inverted, diet quality, sun-exposure hygiene) — a documented expansion beyond
    the doc's own two named signals, not an invented schema field.

    `uv_index` is the doc's "high unprotected UV index exposure" signal — the real
    value most recently captured by weather/service.py's OpenUV integration for
    this user (`weather_service.get_latest_uv_index`), not a live fetch triggered
    by score computation itself. `None` when no reading was ever captured
    (unconfigured key, or the user never opened a page with the topbar chip) — an
    honest degrade, not a fabricated reading. When a real high UV Index (WHO scale,
    >= `LIFESTYLE_HIGH_UV_INDEX_THRESHOLD`) coincides with reported sun exposure in
    the most recent log, applies an additional flat deduction — "unprotected" is
    approximated as "spent measurable time outdoors on a real high-UV day" (no
    sunscreen-usage cross-reference exists to know for certain)."""
    if not logs:
        return 50.0
    total = 0.0
    for log in logs:
        exercise = min(
            100.0,
            (log.get("exercise_frequency") or 0)
            / constants.LIFESTYLE_EXERCISE_TARGET_TIMES_PER_WEEK
            * 100,
        )
        stress = max(
            0.0,
            min(
                100.0,
                (constants.LIFESTYLE_STRESS_MAX - (log.get("stress_level") or 5))
                / (constants.LIFESTYLE_STRESS_MAX - 1)
                * 100,
            ),
        )
        diet = max(
            0.0,
            min(100.0, (log.get("diet_quality") or 5) / constants.LIFESTYLE_DIET_MAX * 100),
        )
        sun_hours = (log.get("environmental_exposure") or {}).get("sun_hours") or 0
        sun_hygiene = max(0.0, 100.0 - sun_hours * constants.LIFESTYLE_SUN_HOURS_PENALTY_PER_HOUR)
        total += (exercise + stress + diet + sun_hygiene) / 4
    score = total / len(logs)

    latest_sun_hours = (logs[0].get("environmental_exposure") or {}).get("sun_hours") or 0
    if (
        uv_index is not None
        and uv_index >= constants.LIFESTYLE_HIGH_UV_INDEX_THRESHOLD
        and latest_sun_hours > 0
    ):
        score = max(0.0, score - constants.LIFESTYLE_UNPROTECTED_HIGH_UV_DEDUCTION)
    return score


def _sleep_quality_score(logs: list[dict[str, Any]]) -> float:
    """S — Sleep (15%): "evaluated against an optimal 8-hour baseline", modeled as
    a band (`SLEEP_OPTIMAL_MIN_HOURS`-`SLEEP_OPTIMAL_MAX_HOURS` = 100, linear
    falloff outside it) — docs/AI_ML.md's "60% duration + 40% self-rated quality"
    split. Uses the most recent log — a "today" figure — since the doc gives no
    window for this component (unlike lifestyle's 30-day / hydration's 7-day)."""
    if not logs:
        return 50.0
    latest = logs[0]
    hours = latest.get("sleep_hours")
    if hours is None:
        duration_score = 50.0
    elif constants.SLEEP_OPTIMAL_MIN_HOURS <= hours <= constants.SLEEP_OPTIMAL_MAX_HOURS:
        duration_score = 100.0
    elif hours < constants.SLEEP_OPTIMAL_MIN_HOURS:
        shortfall = constants.SLEEP_OPTIMAL_MIN_HOURS - hours
        duration_score = max(0.0, 100.0 - shortfall * constants.SLEEP_DURATION_PENALTY_PER_HOUR)
    else:
        excess = hours - constants.SLEEP_OPTIMAL_MAX_HOURS
        duration_score = max(0.0, 100.0 - excess * constants.SLEEP_DURATION_PENALTY_PER_HOUR)
    reported_quality = latest.get("sleep_quality") or constants.SLEEP_DEFAULT_QUALITY_WHEN_MISSING
    quality_score = (reported_quality / 10) * 100
    return (
        constants.SLEEP_DURATION_WEIGHT * duration_score
        + constants.SLEEP_SELF_RATED_WEIGHT * quality_score
    )


def _hydration_score(logs: list[dict[str, Any]]) -> float:
    """H — Hydration (10%): "evaluated against a 3.0 L daily fluid benchmark"
    (`HYDRATION_BENCHMARK_LITERS` — ADR-021 C3/ADR-028: this was a hardcoded 2.0L
    before P10, a real code bug, not a documentation-only fix), averaged over
    `HYDRATION_WINDOW_DAYS`."""
    window = logs[: constants.HYDRATION_WINDOW_DAYS]
    if not window:
        return 50.0
    total = sum(
        min(
            100.0,
            (log.get("water_intake_liters") or 0) / constants.HYDRATION_BENCHMARK_LITERS * 100,
        )
        for log in window
    )
    return total / len(window)


def _routine_adherence_score(step_ids: list[int], logs: list[dict[str, Any]]) -> float:
    """A — Adherence (20%): "computed from the active 14-day completion logs;
    defaults to 100% for a new assessment with no history" (`ADHERENCE_WINDOW_DAYS`
    / `ADHERENCE_DEFAULT_WHEN_NO_DATA` — ADR-028: this was a 7-day window
    defaulting to a neutral 50.0 before P10, matching the *other*, non-canonical
    `mile_2.docx`'s text rather than this pack's canonical `MILESTONE 2.docx`; a
    real code fix, not a rename). No active routine, or no logged days in the
    trailing window, is treated as full adherence — a brand-new user hasn't had
    the chance to skip anything yet, not a punitive or neutral guess.

    Pure: takes the already-fetched active step ids and the already-fetched
    window of routine logs (`scores/service.py` does the Mongo/Postgres reads and
    the day-window math) — no I/O, no clock read, in this function."""
    if not step_ids or not logs:
        return constants.ADHERENCE_DEFAULT_WHEN_NO_DATA
    active_step_ids = set(step_ids)
    completed_count = sum(
        1
        for log in logs
        for entry in log.get("completed_steps", [])
        if entry.get("routine_step_id") in active_step_ids
    )
    scheduled = len(step_ids) * len(logs)
    if not scheduled:
        return constants.ADHERENCE_DEFAULT_WHEN_NO_DATA
    return min(100.0, (completed_count / scheduled) * 100)


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
    """The exact weighted equation (MILESTONE 2.docx §2):

        Score = C*0.35 + L*0.20 + S*0.15 + A*0.20 + H*0.10

    Weights are passed in (not imported from constants.py) — `scoring_weights` is
    a real, versioned Postgres table (config-driven scoring, docs/ARCHITECTURE.md
    §7), not a constant; `constants.py` only documents/seeds the default. A NumPy
    dot product, not a plain sum, per the doc's own "utilizing NumPy" tooling note
    — five terms is too small to matter for performance, this matches the
    specified tool, not an optimization."""
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
    return float(np.clip(np.dot(scores, weights), 0.0, 100.0))


# skin_profiles.age_group is a band (web/lib/schemas/skin-profile.ts's AGE_GROUPS),
# never an exact age — this is the documented representative-age approximation
# derive_skin_age's "actual_age" input uses, per decision C6/ADR-028. Midpoint of
# each band; "Under 18"/"65+" are open-ended, so a reasonable single representative
# value is picked rather than a range.
_AGE_GROUP_REPRESENTATIVE_AGE: dict[str, float] = {
    "Under 18": 16.0,
    "18-24": 21.0,
    "25-34": 29.5,
    "35-44": 39.5,
    "45-54": 49.5,
    "55-64": 59.5,
    "65+": 70.0,
}


def representative_age_for_group(age_group: str | None) -> float | None:
    """None for an unset or unrecognized band — Skin Age isn't derivable without a
    real age input, and this returns an honest "can't compute" rather than
    guessing a default band."""
    if age_group is None:
        return None
    return _AGE_GROUP_REPRESENTATIVE_AGE.get(age_group)


# Mirrors web/lib/score-components.ts's SCORE_BANDS exactly (P1 ramp) — one ramp,
# not a second invented one, so the backend's `band` and the frontend's own
# client-side re-derivation of the same value never disagree.
_SCORE_BAND_GOOD_MIN = 75.0
_SCORE_BAND_FAIR_MIN = 60.0


def score_band(overall_score: float) -> str:
    if overall_score >= _SCORE_BAND_GOOD_MIN:
        return "Good"
    if overall_score >= _SCORE_BAND_FAIR_MIN:
        return "Fair"
    return "Poor"


def derive_skin_age(skin_condition_score: float, actual_age: float) -> float:
    """Skin Age (decision C6, ADR-028) — derived from the Condition sub-score and
    the user's actual age, per C6's own instruction ("Formula ... designed and
    unit-tested in the phase that builds it, not invented [at P0]"). A perfect
    condition score (100) means skin_age == actual_age; a condition score of 0
    ages the reported skin_age up by `SKIN_AGE_MAX_PENALTY_YEARS`, linearly in
    between. Monotonic and bounded: skin_age is never younger than actual_age (a
    skin_condition_score can't indicate anything better than "no visible skin
    concerns", not a fountain of youth) and never more than the max penalty older."""
    penalty_fraction = (100.0 - max(0.0, min(100.0, skin_condition_score))) / 100.0
    return actual_age + penalty_fraction * constants.SKIN_AGE_MAX_PENALTY_YEARS
