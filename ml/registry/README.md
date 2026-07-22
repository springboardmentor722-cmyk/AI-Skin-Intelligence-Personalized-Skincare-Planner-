# Model registry (documented layout, M3-H)

Per `docs/AI_ML.md`'s "Serving & ops" section: trained artifacts are versioned here (or
in S3 for anything too large for the repo) as `{model}-{semver}/`, e.g.
`recommender-1.0.0/`. The active version for each model surface is a config value
(`AI_IMPL_*` env vars, `backend/app/core/config.py`), never a hardcoded path — the
same config-selected-implementation pattern ADR-007 already establishes for
stub/real switching.

**Empty today, on purpose.** Every AI surface M3 makes real —
`IngredientSuitability` (rule-based), `Recommender` v2 (content-based weighted
formula), `ProgressTrendAnalyzer` (linear-trend + R²) — is deterministic, not a
trained model; `TextEmbedder`'s real implementation is a pinned, pretrained
SentenceTransformers checkpoint downloaded at runtime, not something this project
trains and versions itself. There is nothing to register until:

- The optional flag-gated LightGBM ranker (`AI_IMPL_RECOMMENDER=ranker`,
  milestone_3.md §M3-D) is trained on real accumulated `recommendation_feedback`
  labels — deliberately not built yet since no real labels exist (`AGENTS.md` §0.2:
  never train on fabricated data).
- `SkinTypeClassifier`/`ConcernDetector`/`SkinScorePredictor` (still stubs, ADR-007)
  get real trained implementations in a future milestone.

**Expected shape once a real artifact lands**, matching `docs/AI_ML.md`'s model
cards:

```
ml/registry/
  {model}-{semver}/
    model.bin (or a pointer file if it lives in S3 instead)
    metadata.json   # training data slice, metrics vs. the model card's targets,
                     # fairness slice table (Fitzpatrick/Monk tone-balanced, for
                     # any image model), training date, git commit
```

Rollout stays per-model feature flags, M2-precedent canary at 10% of users before
100% (`docs/AI_ML.md` "Serving & ops") — no change to that plan here, just the
storage layout it will use.
