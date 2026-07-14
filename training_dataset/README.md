# training_dataset/

Landing zone for externally-sourced datasets, per
`dataset_and_API_reference/AI_Skin_Datasets_APIs_Research.docx` and the canonical
registry at `docs/DATASETS_AND_APIS.md` (read that file first — it documents access
method, target store, and ToS caveats for every source below).

- `raw/` — untouched downloads (Kaggle CSVs, etc.), one subfolder per dataset.
- `processed/` — intermediate normalized files, if a pipeline stage needs to persist
  something between download and database load (not required for every pipeline).

Neither folder is meant to be committed with real data in it (`.gitignore` below) —
this is a local working directory, not a data store. The actual system of record is
Postgres/MongoDB (`database_schemas/`), same as everywhere else in this repo.

## Status

| Dataset | Target | Status |
|---|---|---|
| Kaggle Sephora products & reviews | `products`/`ingredients`/`product_ingredients` (Postgres) | **Blocked** — `KAGGLE_USERNAME`/`KAGGLE_KEY` are blank in `.env`. Pipeline code is real and complete (`backend/app/services/admin/ingest/products.py`, `make ingest-products`); add real credentials to unblock, nothing else to build. |
| PubMed abstracts | `knowledge_articles` (Mongo) | **Done** — no credential needed. `make ingest-knowledge` (`backend/app/db/ingest_knowledge.py`), real query per seeded `skin_concerns`, real title/abstract/PMID/link stored. |
| ISIC skin images / Kaggle facial skin-type sets | `ml/` training data | **Not attempted.** Real CNN training (`SkinTypeClassifier`/`ConcernDetector`, `docs/AI_ML.md`) is explicitly out of scope for this pass — needs a labeled training pipeline, GPU/training infra, and a tone-balanced fairness eval set that don't exist yet in this repo. Milestone 2's own task doc specifies "Scikit-learn / Custom Rule Algorithms" for concern severity, which is what's actually built (`backend/app/services/scores/service.py`), not image classification. |
| INCIDecoder / COSDNA / DermNet / AAD / Google Scholar | — | **Not scraped, by design.** `docs/DATASETS_AND_APIS.md` marks these "no API — do not scrape" (ToS). The ingredient master stays hand-curated (`backend/app/db/seed.py`); PubMed/Semantic Scholar/OpenAlex/Crossref are the license-friendly research alternatives. |

## To unblock the Kaggle pipeline

1. Get a Kaggle API token (kaggle.com → Account → Create New Token).
2. Set `KAGGLE_USERNAME`/`KAGGLE_KEY` in `.env` (never commit real keys).
3. `make ingest-products` — downloads into `raw/sephora/`, normalizes, upserts into
   Postgres. Idempotent, safe to re-run (same discipline as `make seed`).
