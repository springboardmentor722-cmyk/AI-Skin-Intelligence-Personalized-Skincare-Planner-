# Skinlytics — `ml/`

Real as of M3-H (`eval/`, `registry/`) and the 2026-07-23 dataset/training pass
(`training/`, `registry/skin-lesion-screener-0.1.0/`). Full design: `docs/AI_ML.md`.
Three subtrees:

- **`eval/`** — the evaluation harness (`docs/AI_ML.md` §"Evaluation harness"). `make eval`
  runs it. Golden sets are built from the real, live seeded catalog (never a fabricated
  fixture presented as real data, `AGENTS.md` §0.2) — currently covers the
  `IngredientSuitability` model card (precision@flag, zero-missed-allergy — a
  release-blocking property, not a metric to monitor) and honestly reports
  `"no_label_data"` for the Recommender's NDCG@10/precision@5 until
  `recommendation_feedback` (M3-D) has real usage to score against.
- **`training/`** — real model training code. Currently one model:
  `train_lesion_classifier.py` (ResNet18 transfer learning over the real, fully
  downloaded ISIC 2019 dataset, `training_dataset/raw/isic-2019/`) +
  `verify_artifact.py` (a smoke check that the saved weights actually load and
  predict on real sample images, not just that training exited zero). **Read
  the module docstring in `train_lesion_classifier.py` and
  `registry/skin-lesion-screener-0.1.0/README.md` before touching this model** —
  it classifies dermatological lesion categories, is explicitly *not* the app's
  consumer "Concern Detector," and has a documented, unresolved fairness-eval
  gap (no skin-tone metadata in the source dataset).
- **`registry/`** — trained artifacts as `{model}-{semver}/` (see
  `registry/README.md` for the full layout convention). `metadata.json` + each
  model's own `README.md` are tracked; the weights file itself
  (`model.pt`/`.pth`/`.onnx`) is gitignored — large and fully reproducible by
  re-running the matching script under `training/` against the same real,
  already-downloaded dataset.

## Two different dependency stories, on purpose

- **`eval/`** deliberately has no environment of its own — it reuses `backend/`'s
  already-installed dependencies (SQLAlchemy, Motor, the real `app.ai.suitability`
  module) via `PYTHONPATH` rather than duplicating them. `make eval`/`make test`
  invoke it from inside `backend/`'s venv.
- **`training/`** has its *own* uv project (this directory's `pyproject.toml`) with
  torch/torchvision/scikit-learn — deliberately kept **out** of `backend/`'s own
  dependency set, since the FastAPI API service has no business carrying ~1GB of
  deep-learning dependencies to serve a request. GPU support: this dev machine
  resolves a CUDA 13.2 wheel (`[[tool.uv.index]]` in `pyproject.toml`, matching an
  RTX 5050 Laptop GPU's driver) — falls back to CPU automatically on a machine
  with no matching GPU (torch's own behavior).

Both cases share the same underlying reasoning: match each script's real
dependency needs, don't force one venv shape onto every use case in `ml/`.

## Running things directly

Evaluation harness:
```
cd backend
PYTHONPATH="../ml" uv run python -m eval.run
```
Writes a timestamped JSON report to `ml/eval/reports/` (gitignored — regenerated
every run) and exits non-zero if `zero_missed_allergy` ever fails.

Lesion-classifier training (from this directory, its own venv):
```
cd ml
uv run python -m training.train_lesion_classifier   # writes registry/skin-lesion-screener-0.1.0/
uv run python -m training.verify_artifact            # smoke-checks the saved weights
```
