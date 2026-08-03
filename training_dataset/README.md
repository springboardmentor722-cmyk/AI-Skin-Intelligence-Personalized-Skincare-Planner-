# training_dataset/

Landing zone for externally-sourced datasets, per
`dataset_and_API_reference/AI_Skin_Datasets_APIs_Research.docx` and the canonical
registry at `docs/DATASETS_AND_APIS.md` (read that file first — it documents access
method, target store, and ToS caveats for every source below). **`MANIFEST.md`
(same directory) has the exact folder name / expected filename per dataset** — check
it before assuming a download landed in the right place.

- `raw/` — untouched downloads (Kaggle CSVs, etc.), one subfolder per dataset
  (`sephora/`, `cosmetics/`, `isic-2019/` — see `MANIFEST.md`).
- `processed/` — intermediate normalized files, if a pipeline stage needs to persist
  something between download and database load (not required for every pipeline).

Neither folder is meant to be committed with real data in it (`.gitignore` below) —
this is a local working directory, not a data store. The actual system of record is
Postgres/MongoDB (`database_schemas/`), same as everywhere else in this repo.

**If a pipeline expects a file here and it's missing, stop and ask** — don't stub
around it or claim the feature works. See `AGENTS.md` §0.1.

## Status

| Dataset | Target | Status |
|---|---|---|
| Kaggle Sephora products & reviews | `products`/`ingredients`/`product_ingredients` (Postgres) | **Done (2026-07-14).** Real `KAGGLE_USERNAME`/`KAGGLE_KEY` added, `make ingest-products` run for real against live Docker Postgres: 8,464 new products ingested (30 rejected for missing mandatory fields — brand/name/price), 0 already present. Two real bugs found and fixed while running this for the first time (see `PROGRESS.md`): a within-product duplicate-ingredient crash, and a semicolon-delimited sub-list overflowing `ingredient_name`'s `VARCHAR(150)`. |
| Kaggle Cosmetics Datasets | `training_dataset/raw/cosmetics/cosmetics.csv` | **Downloaded (2026-07-14), landing only** — ~1.1MB, no ingest pipeline built for it (not required for Milestone 2). |
| Kaggle Skincare Products Clean Dataset | `products`/`ingredients`/`product_ingredients` (Postgres) | **Done (2026-08-03).** Real `make ingest-skincare-clean` run for real against live Docker Postgres: 1,138 new products ingested (0 rejected), 0 already present. No brand_name column in source — brand extracted from product_name via longest-match-first against 44 known multi-word brands (La Roche-Posay, Elizabeth Arden, First Aid Beauty, etc.), then "The X" pattern, then single leading word. GBP pricing. Zero nulls. |
| Kaggle E-Commerce Cosmetics Dataset | `products`/`ingredients`/`product_ingredients` (Postgres, skincare only) | **Done (2026-08-03).** Real `make ingest-ecommerce-cosmetics` run against live Docker Postgres: 1,838 new skincare products ingested, 140 already present, 10,637 rejected (6 categories filtered to skincare only — the other 5 real categories body/lips/eyes/face/hair are rejected, never guessed). INR pricing throughout. 8 real subcategory values: serum/moisturizer/cleanser/face wash/mask/toner/eye treatment (mapped to 7-value catalog)/spray (maps to uncategorized). Has real brand_name column (no extraction needed). Requires latin-1 encoding. |
| Kaggle Skincare Products and Ingredients (Sephora_all_423.csv) | `products`/`product_skin_types` (Postgres) | **Done (2026-08-03).** Real `make ingest-skincare-ingredients` run against live Docker Postgres: 1,051 new products ingested, 1,125 duplicates already present, 3 rejected (mandatory field missing). 2,179 total rows from an independently-scraped Sephora catalog (confirmed distinct from the earlier nadyinky Sephora dataset — entirely different field set: no product_id/brand_id). Of 5 files in this Kaggle dataset, only Sephora_all_423.csv is product-shaped and ingested; the other 4 (ingredient dictionary, embeddings, binary ingredient flatten, substitution pairs) are landing-only. Includes the 5 real seeded skin-type names parsed from free-text `Skin Type` column. The source's `ingredients` field is unparsed marketing prose (not a clean INCI list) with no reliable parse boundary — intentionally left empty (`[]`) in DB per "never guess" principle. USD pricing. No category column in source — all rows get `category="uncategorized"`. |
| PubMed abstracts | `knowledge_articles` (Mongo) | **Done** — no credential needed. `make ingest-knowledge` (`backend/app/db/ingest_knowledge.py`), real query per seeded `skin_concerns`, real title/abstract/PMID/link stored. |
| ISIC 2019 (Kaggle mirror) | `training_dataset/raw/isic-2019/` | **Downloaded (2026-07-14), landing only** — 9.2GB, all 8 lesion classes (AK/BCC/BKL/DF/MEL/NV/SCC/VASC) + ground-truth/metadata CSVs extracted. Real CNN training (`SkinTypeClassifier`/`ConcernDetector`, `docs/AI_ML.md`) is still out of scope for Milestone 2 — this dataset just exists locally now for whenever that training pipeline is actually built. First download attempt failed twice on disk-full (the full zip is ~9.77GB, extraction needs ~20GB peak free space) before succeeding on the third try with enough headroom. |
| INCIDecoder / COSDNA / EU CosIng / DermNet / AAD / Google Scholar | — | **Not scraped, by design.** `docs/DATASETS_AND_APIS.md` marks these "no API — do not scrape" (ToS). The ingredient master stays hand-curated (`backend/app/db/seed.py`); PubMed/Semantic Scholar/OpenAlex/Crossref are the license-friendly research alternatives. |

## Re-running the Kaggle pipeline

`make ingest-products` is idempotent (dedupes by brand+name, safe to re-run) — real
credentials are already in `.env`/`.env.development` as of 2026-07-14. A separate,
unrelated pre-existing gap was found while verifying the full test suite after this:
`.env.development`'s `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` are blank while
`docker-compose.yml`'s MinIO container uses hardcoded dev-only
`skinlytics`/`skinlytics_dev_only` — causes 5 unrelated storage test failures
(document upload/presigned URLs). Not fixed here (out of scope for Milestone 2 —
storage backs consultant/dermatologist verification documents, not the assessment
engine); flagged for whoever picks up that surface next.
