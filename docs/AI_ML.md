# AI / ML engine

Design of the intelligence layer. In **M1 everything is stubbed behind interfaces**
(deterministic placeholders) so API contracts are frozen; real models land M2–M3
(ADR-007). Services never import model code — they call `backend/app/ai/` interfaces
selected by config. Every AI response carries a `confidence` field that the UI surfaces
(Geist confidence labels, `DESIGN.md` §9).

## Principles
1. **Contract-first.** Request/response schemas are fixed in M1; models swap in behind
   them without touching services or the frontend.
2. **Config-selected implementations.** `AI_IMPL=stub|real` (per interface) in env; no
   code changes to switch.
3. **Hard safety filters are rules, not learned.** Allergy and avoid-ingredient exclusions
   are deterministic Postgres filters applied *before* any model ranks anything.
4. **Evaluated before shipped.** No model reaches prod without passing the offline eval
   gate (below), including the skin-tone fairness check.
5. **Explainable outputs.** Recommendations return machine-readable `reasons[]`
   (suitability match, concern overlap, budget fit) that the UI renders as "Why this
   matches you".

## Model interfaces (the contract services depend on)
All under `backend/app/ai/`; one class per surface, stub + real impl.

| Interface | Input → Output | Real impl (M2+) | Backing store |
|---|---|---|---|
| `SkinTypeClassifier` | scan image → skin type + confidence | EfficientNet-B0 | image S3; result → Mongo `skin_assessments` |
| `ConcernDetector` | scan image → [{concern, severity, confidence}] | multi-label CNN | Mongo `skin_assessments` |
| `IngredientSuitability` | (profile, ingredient) → suitability + interaction flags | gradient-boosted + rules over PG junctions | PG + vector |
| `SkinScorePredictor` | features → predicted trajectory | regression / gradient boosting | PG `skin_assessments` (renamed from `skin_scores`, M2) |
| `ProgressTrendAnalyzer` | assessment/score time series → trend + insight | time-series model | Mongo `progress_logs` |
| `Recommender` | profile + candidates → ranked products + reasons | XGBoost/LightGBM ranker | vector + ES + PG |
| `TextEmbedder` / `NLPEngine` | product/ingredient/article text → vector + extracted attrs | SentenceTransformers / PubMedBERT | Vector DB |

Representative contract (all follow this shape — full Pydantic models in
`backend/app/ai/schemas.py`):

```python
class ConcernFinding(BaseModel):
    concern: ConcernEnum            # the PDF's 10 concerns
    severity: int                   # 1–10
    confidence: float               # 0–1

class ConcernDetector(Protocol):
    async def detect(self, image_key: str, profile: SkinProfile) -> list[ConcernFinding]: ...

class RecoRequest(BaseModel):
    user_id: str                    # TEXT id (ADR-003)
    candidates: list[int] | None    # None = full catalog pre-filter
    filters: RecoFilters            # category, budget, brand, preferences
class RecoItem(BaseModel):
    product_id: int
    match_score: float              # 0–100, drives the Match ring
    reasons: list[Reason]
class Recommender(Protocol):
    async def rank(self, req: RecoRequest) -> list[RecoItem]: ...
```

## Stub semantics (M1)
Stubs are **deterministic and seeded by `hash(user_id)`** so demos and tests are stable:
`ConcernDetector` returns the profile's declared concerns with fixed severities and
`confidence=0.75`; `SkinTypeClassifier` echoes the declared type; `Recommender` filters by
skin type + concern junctions and sorts by rating, emitting real `reasons[]`. The whole
request path — and every frontend screen — works end-to-end before any model exists.

## Weighted skin-health score (config-driven, not ML)
A transparent weighted sum, tunable without redeploy via PG `scoring_weights`
(CHECK: weights sum = 1.00). Every weight/benchmark/threshold below is defined
exactly once, in `backend/app/services/scores/constants.py` — no numeric literal
for one appears anywhere else in `scoring_engine.py`/`service.py` (Milestone 2 P10,
docs/DECISIONS.md ADR-028); the constants module names are given alongside each
value here so this doc and the code can't silently drift.

```
overall = 0.35·skin_condition + 0.20·lifestyle + 0.15·sleep_quality
        + 0.20·routine_adherence + 0.10·hydration
```

Component normalization (each 0–100, all pure functions in `scoring_engine.py` —
no I/O, no clock reads, deterministic; `scores/service.py` fetches every input
and passes it in):
- **skin_condition** = 100 − tiered deduction over active concerns:
  −`CONDITION_HIGH_SEVERITY_DEDUCTION` (15) pts per High severity
  (severity_rating ≥ `CONDITION_HIGH_SEVERITY_MIN`, 8), −`CONDITION_MEDIUM_SEVERITY_DEDUCTION`
  (7) pts per Medium (≥ `CONDITION_MEDIUM_SEVERITY_MIN`, 4), 0 for Low (1–3), from
  the current profile's concerns — exact per the docx for total deduction ≤ 100.
  Concerns sharing a seeded synonym pair (Hyperpigmentation/Dark Spots,
  Wrinkles/Fine Lines — two cards for the same underlying condition) collapse to
  one deduction at their higher severity, not two. Past 100 total deduction (the
  docx doesn't specify this range; reachable since 10 concerns are seeded and
  nothing stops most being reported High) the score decays from
  `CONDITION_SATURATION_TAIL_SCALE` (5.0) toward, never reaching, 0 instead of
  flooring flat — ADR-034, so severity keeps discriminating instead of every
  profile past ~7 simultaneous High concerns reading identically.
- **lifestyle** = equal-weighted sub-index of exercise frequency, stress
  (inverted), diet quality, sun-exposure hygiene from `lifestyle_logs` (30-day
  window), plus a real unprotected-high-UV-exposure penalty
  (`LIFESTYLE_UNPROTECTED_HIGH_UV_DEDUCTION`, 20 pts) when OpenUV data exists for
  the user (`weather_service.get_latest_uv_index`, WHO UV Index ≥
  `LIFESTYLE_HIGH_UV_INDEX_THRESHOLD` (6) "High" + reported sun exposure in the
  most recent log) — best-effort, never fetched live as a side effect of scoring,
  so it's a no-op when no OpenUV reading was ever captured.
- **sleep_quality** = `SLEEP_DURATION_WEIGHT` (60%) duration score
  (`SLEEP_OPTIMAL_MIN_HOURS`-`SLEEP_OPTIMAL_MAX_HOURS`, 7–9 h band = 100, linear
  falloff) + `SLEEP_SELF_RATED_WEIGHT` (40%) self-rated quality.
- **routine_adherence** = completed checklist steps ÷ scheduled steps, trailing
  `ADHERENCE_WINDOW_DAYS` (14) days — MILESTONE 2.docx's literal "active 14-day
  completion logs". **Defaults to `ADHERENCE_DEFAULT_WHEN_NO_DATA` (100) for a new
  assessment with no history** (no active routine yet, or none logged in the
  window) — corrected at P10/ADR-028 from a 7-day window defaulting to a neutral
  50, which had matched the *other*, non-canonical `mile_2.docx`'s text rather
  than this pack's canonical `MILESTONE 2.docx`.
- **hydration** = `min(100, litres/day ÷ HYDRATION_BENCHMARK_LITERS (3.0) × 100)`,
  `HYDRATION_WINDOW_DAYS` (7-day) average — corrected at P10/ADR-028 from a
  hardcoded 2.0L benchmark (ADR-021 C3 flagged this as a real code bug, not a
  documentation-only fix).

`SkinHealthScoringService` reads the active weight row; experiments are a DB update.

### Skin Age (decision C6, ADR-028)
`scoring_engine.derive_skin_age(skin_condition_score, actual_age)` — a perfect
condition score (100) means skin_age == actual_age; a condition score of 0 ages
the reported skin_age up by `SKIN_AGE_MAX_PENALTY_YEARS` (10 years), linearly in
between. `actual_age` itself is a representative-age approximation
(`representative_age_for_group`) since `skin_profiles.age_group` is a band
("25-34"), never an exact age — the band's midpoint stands in for it (documented
per-band table in `scoring_engine.py`); `skin_age` is `None` when no age_group is
set yet, an honest "can't compute" rather than a guessed default band.

### Score band
`scoring_engine.score_band(overall_score)` — the same Good (≥75) / Fair (≥60) /
Poor ramp `web/lib/score-components.ts`'s `SCORE_BANDS` uses on the frontend; one
ramp, not two that could drift apart.

## Dynamic routine generator (config-driven, not ML — M2-P11, ADR-029)
`backend/app/services/routines/constants.py` fixes six canonical categories
(Cleansing, Exfoliation, Treatment, Moisturizing, Sun Protection, Night Care)
and the exact AM (Cleanser → Treatment → Moisturizer → SPF) / PM (Double
Cleanse → Treatment → Ceramide Barrier) / Weekly (Exfoliation only) pipelines —
every profile gets the identical fixed pipeline; there is no skin-type-
conditional step *removal*. Candidate selection per step is a seeded-random
pick (`app.ai.seeding.seeded_random(user_id, "routine", routine_type)`) among
real product candidates matching the step's category and, preferentially, the
user's own concerns — deterministic per user, not reproducible across users.

Two safety guardrails run as a **distinct, independently-testable layer AFTER
generation** (`routines/guardrails.py`), never folded into candidate selection,
so a future generator change can't quietly bypass them:
- **Sensitivity guardrail** (`requires_soothing_substitution`): a Sensitive
  skin type, OR redness severity strictly greater than 7/10, substitutes any
  harsh-active step (Retinoids/Salicylic Acid/AHAs-BHAs ingredient category)
  with the catalog's one real soothing product — replaces the step, never
  appends a second one.
- **Sunscreen guardrail** (`assert_sunscreen_present`): raises
  `MissingSunscreenError` — never silently passes — if a generated AM routine
  has no Sun Protection step. No parameter disables this check.
- **Interaction guardrail** (M2-P12/P14, `apply_interaction_guardrail`):
  substitutes the *later* of any two steps whose real ingredients form an
  "avoid"-verdict pair in the curated interaction matrix (below) with the same
  soothing product — runs after the sensitivity guardrail, so a
  sensitivity-driven substitution is itself checked for new conflicts.

Adaptive regeneration (`get_or_generate_routines`): AM/PM/Weekly regenerate
when the user's current `skin_profile_id` differs from the version the
existing routines were generated against (a real re-assessment); Seasonal
additionally regenerates on a calendar-quarter change. "Respond to progress
logs" has no concrete trigger implemented — Progress Tracking has no
documented hook into routine regeneration to wire into (flagged in
`PROGRESS.md`, not invented).

## Ingredient intelligence (rule-based, not ML — M2-P12, ADR-030/031)
`app.ai.suitability.RealIngredientSuitability` — fixed, documented confidence
per rule (never learned), so the zero-missed-allergy requirement stays
auditable. Checked in order, first match wins:
1. **Structured allergy** (`skin_profile_allergies`, P7/ADR-026) — an exact
   `ingredient_id` match is the highest-confidence case (0.98); a name/INCI
   synonym match (`app.ai.ingredient_synonyms`, a small curated set of true
   1:1 alternate-name facts — e.g. "Vitamin C" / "Ascorbic Acid" — never a
   drug-class or cross-reactivity inference) against a *different* ingredient
   is flagged too, at lower confidence (0.75): "flag on uncertainty rather
   than suppress."
2. **Free-text allergy/sensitivity** (`skin_profiles.allergies`/
   `sensitivities`) — exact tag match, substring match, or the same synonym-
   group match as above.
3. **Skin-type avoid-flag** (`ingredient_skintype_avoid`).
4. Otherwise suitable, baseline confidence (0.6, "no known conflicts").

**Interaction matrix** (`app.ai.interactions`) — a small, hand-curated,
versioned table of real, well-established, non-controversial pairwise
interactions (`avoid`/`caution`/`synergy` + a plain-language reason), never an
inferred-at-runtime relationship. Consumed by both the Ingredient Analyzer's
on-demand interaction checker and the routine generator's interaction
guardrail above — one matrix, two consumers.

## Model cards (targets set with the first eval set, M2)

| Model | Data | Primary metrics | Latency p95 | Key risks |
|---|---|---|---|---|
| Skin Type Classifier | Kaggle facial skin-type sets | top-1 accuracy; per-tone gap | 400 ms | tone bias, lighting variance |
| Concern Detector | ISIC (lesion/condition) + facial sets | macro-F1 per concern; severity MAE | 600 ms | domain gap (dermoscopic vs selfie), tone bias |
| Ingredient Suitability | PG junctions + curated labels | precision@flag; zero missed allergy conflicts (hard req) | 50 ms | incomplete junction data |
| Recommender | interactions + suitability + ratings | NDCG@10, precision@5, user satisfaction | 200 ms rank stage | popularity bias, cold start |
| Score Predictor | `skin_assessments` history | MAE vs realized score | 100 ms | sparse history |
| Trend Analyzer | progress/assessment series | trend directional accuracy | 200 ms | noisy self-reports |
| NLP/Embedder | product/ingredient/article text | retrieval recall@20 | batch | INCI parsing errors |

**Fairness requirement (non-negotiable for a skin product):** image models are evaluated
across **Fitzpatrick I–VI / Monk 10-tone** balanced slices; a per-tone accuracy gap > 5 pp
blocks release. Eval sets must be tone-balanced by construction; report the slice table in
every eval run. Low-confidence outputs (< 0.6) trigger the UI's low-confidence warning and
never auto-write to progress history.

## Recommendation pipeline (M2+)
```
User profile (PG) + preferences (Mongo)
 1. Relational pre-filter — PG junctions (ingredient_concern_treats,
    ingredient_skintype_avoid, product_skin_types, product_concerns);
    allergy/avoid exclusions are HARD filters, applied first        (~50 ms)
 2. Vector similarity — products/ingredients/articles namespaces,
    metadata-filtered to step-1 candidates                          (~150 ms)
 3. Keyword/hybrid — Elasticsearch (budget, brand, category, is_active) (~100 ms)
 4. Rank — XGBoost over {similarity, suitability, rating, popularity,
    price-fit, concern overlap} + light MMR diversity re-rank        (~200 ms)
 5. Serve + cache — Redis recommendation:cache:{user_id}, TTL 24 h;
    INVALIDATED on any profile/preference/catalog change
```
**Cold start:** no interaction history → pure content-based (profile↔product suitability)
with a popularity prior; never rank an item that fails step 1.
**Feedback loop:** thumbs/save/purchase events land in Mongo and become ranking labels.

## Vector database
Design: `database_schemas/skinlytics_vector_db_schema_v3.txt`. Summary:
- **Dev FAISS** (local, free) / **prod Pinecone** (managed ANN + metadata filtering);
  identical namespace/metadata contract on both.
- **Namespaces:** `products`, `ingredients`, `knowledge_articles`, `user_profiles`,
  `skin_assessments`.
- **IDs mirror the source of truth:** `product_{id}`, `ingredient_{id}`, `article_{id}`,
  `user_{id}` (string — ADR-003), `assessment_{scan_id}`.
- **One embedding model per namespace, pinned in metadata** (mixing versions corrupts
  similarity): products/ingredients all-MiniLM-L6-v2 (384) · articles PubMedBERT (768) ·
  assessments EfficientNet features (1280) · profiles custom feature embedding (384).
- **Embeddings are derived** — nothing is authored here; the whole store is rebuildable.

## Embedding pipeline (M2–M3, rides the outbox — ADR-010)
1. Source change (PG product/ingredient update, Mongo article/assessment write, profile
   edit) appends an outbox row in the same transaction.
2. The arq worker builds the embed text (per-namespace recipes in the schema file;
   long articles chunk as `article_{id}_c{n}`).
3. Embed with the namespace's pinned model (batched).
4. Upsert vector + metadata (`is_active`, skin types, concerns, price, model_version).
5. Record sync bookkeeping in Mongo `product_vectors_metadata`.
**Model-version migration playbook:** bump pinned version → full re-embed of that
namespace into a shadow namespace → flip reads → drop old. Never mix versions in one
namespace.

## Serving & ops
- **Registry:** trained artifacts versioned in `ml/registry/` (or S3) as
  `{model}-{semver}`; the active version is config.
- **Rollout:** per-model feature flags; M2 canaries at 10% of users before 100%.
- **Monitoring:** confidence distributions, per-tone slices, drift on input features,
  rec CTR/satisfaction — surfaced on the Admin monitoring screen (`/admin/monitoring`).

## Evaluation harness (`ml/eval/`)
Golden datasets per model (incl. the tone-balanced image set); `make eval` runs offline
metrics and writes a report; CI blocks a model-version bump if any primary metric or the
fairness gap regresses. Recommendation quality additionally sampled weekly against the
flagged-recommendations admin queue.

## Metrics to wire (PDF §8 → owner)
- Assessment (classification accuracy, scoring consistency, rec relevance) → ml eval +
  Analytics Service.
- Recommendation (suitability accuracy, precision, user satisfaction) → Recommender eval
  + feedback events.
- Progress (adherence accuracy, improvement-tracking quality, engagement) → Progress +
  Analytics Services.
- System (API response time, rec latency, dashboard load, concurrency) → observability
  stack (`ARCHITECTURE.md` §9), dashboards by M3–M4.
