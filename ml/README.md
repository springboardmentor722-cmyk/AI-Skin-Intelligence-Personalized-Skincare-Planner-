# Skinlytics — `ml/`

Real as of M3-H. Full design: `docs/AI_ML.md`. Two subtrees:

- **`eval/`** — the evaluation harness (`docs/AI_ML.md` §"Evaluation harness"). `make eval`
  runs it. Golden sets are built from the real, live seeded catalog (never a fabricated
  fixture presented as real data, `AGENTS.md` §0.2) — currently covers the
  `IngredientSuitability` model card (precision@flag, zero-missed-allergy — a
  release-blocking property, not a metric to monitor) and honestly reports
  `"no_label_data"` for the Recommender's NDCG@10/precision@5 until
  `recommendation_feedback` (M3-D) has real usage to score against.
- **`registry/`** — documented layout only (see `registry/README.md`); no trained
  artifacts exist yet because every M3 AI surface made real
  (`IngredientSuitability`, `Recommender` v2, `ProgressTrendAnalyzer`, `TextEmbedder`) is
  either deterministic/rule-based or a pinned pretrained encoder, not something this
  project trains itself (`docs/AI_ML.md`'s model cards / ADR-007). The layout is ready
  for whenever a real trained model lands.

## No separate Python environment here

`ml/` deliberately has no `pyproject.toml`/venv of its own — `eval/`'s code reuses
`backend/`'s already-installed dependencies (SQLAlchemy, Motor, the real
`app.ai.suitability` module) rather than duplicating them. Both `make eval` and `make
test` invoke it from inside `backend/`'s venv with `ml/` added to `PYTHONPATH`
(`;`-separated — Windows, this repo's primary dev environment; adjust if you're on a
POSIX box where CPython expects `:`).

## Running the eval harness directly

```
cd backend
PYTHONPATH="../ml" uv run python -m eval.run
```

Writes a timestamped JSON report to `ml/eval/reports/` (gitignored — regenerated every
run, never hand-authored) and exits non-zero if `zero_missed_allergy` ever fails.
