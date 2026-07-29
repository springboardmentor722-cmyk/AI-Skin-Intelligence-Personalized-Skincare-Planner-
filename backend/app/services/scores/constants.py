"""Milestone 2 P10 (MILESTONE 2.docx §"2. Weighted Skin Health Scoring Engine") —
every weight, benchmark, and threshold the scoring engine uses, in one place,
mapped line-by-line to the doc. No numeric literal for a weight or benchmark is
allowed anywhere else in this service (`scoring_engine.py`, `service.py`,
`models.py` all import from here) — confirmed by this branch's own grep, printed
in the P10 phase report.

Weights are the DOCUMENTED DEFAULT, not the live source of truth: the tunable
value the engine actually computes against is still the `scoring_weights`
Postgres row (docs/ARCHITECTURE.md §7, AGENTS.md §5 rule 7 — "retuning is a DB
update, not a deploy"). These constants seed that table's column defaults
(`models.py`) and let tests compute an expected composite without a DB round
trip; `calculate_skin_health_score` itself always takes weights as arguments,
never reads this module.
"""

# Skin Health Score = 0.35(C) + 0.20(L) + 0.15(S) + 0.20(A) + 0.10(H)
SKIN_CONDITION_WEIGHT = 0.35
LIFESTYLE_WEIGHT = 0.20
SLEEP_QUALITY_WEIGHT = 0.15
ROUTINE_ADHERENCE_WEIGHT = 0.20
HYDRATION_WEIGHT = 0.10

# --- C: Condition (35%) — "penalised by the total severity of the user's skin
# concerns" ---
CONDITION_HIGH_SEVERITY_MIN = 8  # severity_rating 8-10
CONDITION_MEDIUM_SEVERITY_MIN = 4  # severity_rating 4-7 (1-3 costs nothing)
CONDITION_HIGH_SEVERITY_DEDUCTION = 15.0
CONDITION_MEDIUM_SEVERITY_DEDUCTION = 7.0
CONDITION_DEFAULT_SEVERITY_WHEN_MISSING = 5  # treated as Medium

# ADR-034 — MILESTONE 2.docx §2's own formula ("start at 100, subtract 15/7 per
# concern") is exact and unconditional for total deduction <= 100; it says nothing
# about what happens past that, which is why 7+ simultaneous High-severity
# concerns all silently floored at the same 0. Past 100, the score instead decays
# from this scale toward (never reaching) 0, so worse profiles stay distinguishable.
CONDITION_SATURATION_TAIL_SCALE = 5.0

# --- L: Lifestyle (20%) — "evaluated against daily stress level and sun
# exposure risk" (docs/AI_ML.md's documented 4-component expansion: exercise,
# stress inverted, diet quality, sun-exposure hygiene, equal-weighted) ---
LIFESTYLE_HIGH_UV_INDEX_THRESHOLD = 6.0  # WHO scale: 6-7 High, 8-10 Very High, 11+ Extreme
LIFESTYLE_UNPROTECTED_HIGH_UV_DEDUCTION = 20.0
LIFESTYLE_SUN_HOURS_PENALTY_PER_HOUR = 10.0
LIFESTYLE_EXERCISE_TARGET_TIMES_PER_WEEK = 5.0
LIFESTYLE_STRESS_MAX = 10.0
LIFESTYLE_DIET_MAX = 10.0

# --- S: Sleep (15%) — "evaluated against an optimal 8-hour baseline" ---
SLEEP_OPTIMAL_MIN_HOURS = 7.0
SLEEP_OPTIMAL_MAX_HOURS = 9.0
SLEEP_DURATION_PENALTY_PER_HOUR = 20.0
SLEEP_DURATION_WEIGHT = 0.6
SLEEP_SELF_RATED_WEIGHT = 0.4
SLEEP_DEFAULT_QUALITY_WHEN_MISSING = 5  # out of 10

# --- A: Adherence (20%) — "computed from the active 14-day completion logs;
# defaults to 100% for a new assessment with no history" ---
ADHERENCE_WINDOW_DAYS = 14
ADHERENCE_DEFAULT_WHEN_NO_DATA = 100.0

# --- H: Hydration (10%) — "evaluated against a 3.0 L daily fluid benchmark"
# (ADR-021 C3 — was 2.0L, a real code bug fixed at P10, not a doc-only
# correction) ---
HYDRATION_BENCHMARK_LITERS = 3.0
HYDRATION_WINDOW_DAYS = 7

# --- Skin Age (decision C6, ADR-028) ---
SKIN_AGE_MAX_PENALTY_YEARS = 10.0
