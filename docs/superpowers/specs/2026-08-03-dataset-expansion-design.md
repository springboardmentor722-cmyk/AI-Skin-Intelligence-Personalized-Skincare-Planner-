# Dataset expansion: 7 additional Kaggle product/ingredient sources

Status: approved for planning · Date: 2026-08-03 · Owner: Satya Sai Tharun Jekkamsetti

## Goal

Add 7 new Kaggle product/ingredient datasets to `training_dataset/raw/`, and ingest
the skincare-relevant rows from each into the existing `products` /
`product_ingredients` / `ingredients` Postgres tables, using the same pattern
`backend/app/services/admin/ingest/products.py` already established for the Sephora
dataset. No new architecture, no new schema, no fuzzy-matching layer.

## Non-goals (explicitly dropped from the original ask, with reasons)

- **No fuzzy/RapidFuzz product matching.** The codebase already decided against this
  (`enrich_product_images.py` / `MANIFEST.md` #4: "no fuzzy matching, to avoid ever
  showing a different real product's photo"). Cross-dataset duplicates are caught by
  the existing exact-match `(brand_name, product_name)` natural key in
  `load_into_database()`. Reversing that decision would need its own ADR and review —
  out of scope here.
- **No separate `master_product_schema.md` invented from scratch.** The master schema
  already exists: the `products` table (`database_schemas/skinlytics_postgresql_schema_v3.sql`)
  plus the `Product`/`Ingredient` models. The doc this produces documents *that*
  shape and how each dataset's real columns map onto it — it does not invent a new one.
  each dataset's `column_mapping.json` (per-dataset phase, below) already is that
  documentation, in source-of-truth form.
- **No per-dataset image/URL verification against raw CSVs.** One reusable script
  verifies what's actually live in Postgres (`products.image_url`, `products.product_url`)
  after ingestion — that's the meaningful question ("is our real data broken"), and
  avoids re-checking the same overlapping URLs up to 7 times.
- **No standalone `matched_products.csv` / `duplicates.csv` cross-dataset files.**
  Match/duplicate outcomes are already produced per-run by each ingest module's
  existing accepted/rejected report (`training_dataset/processed/*_ingest_*.json`);
  aggregated into one `missing_data_report.md` instead of a parallel CSV pipeline.

## Datasets (7, in build order — Priority 1 first, per owner's original list)

| # | Dataset | Kaggle slug | Target folder |
|---|---|---|---|
| 5 | Open Beauty Facts | `openfoodfacts/open-beauty-facts` | `training_dataset/raw/open-beauty-facts/` |
| 6 | Skincare Products Clean Dataset | `eward96/skincare-products-clean-dataset` | `training_dataset/raw/skincare-clean/` |
| 7 | Skincare Products and Ingredients | `autumndyer/skincare-products-and-ingredients` | `training_dataset/raw/skincare-ingredients/` |
| 8 | Ulta Beauty Products | `stephaniefong/ulta-beauty-products` | `training_dataset/raw/ulta/` |
| 9 | Amazon Beauty Products | `PromptCloudHQ/amazon-beauty-products` | `training_dataset/raw/amazon/` |
| 10 | E-Commerce Cosmetics Dataset | `devi5723/e-commerce-cosmetics-dataset` | `training_dataset/raw/ecommerce/` |
| 11 | Skin Care Products Dataset | `ruchi798/skincare-products` | `training_dataset/raw/skincare-products/` |

(Numbering continues from `MANIFEST.md`'s existing 1–4.) Kaggle listing, license,
column names, and row counts get verified live (Chrome extension) at the start of
each dataset's phase, not assumed from the dataset title.

## Architecture

Unchanged from today. Each new dataset is its own module in
`backend/app/services/admin/ingest/`, matching `products.py`'s shape exactly:

```
download_dataset() -> Path        # Kaggle API, KaggleCredentialsError guard
normalize_rows(df) -> (accepted, rejected)   # pure, no I/O, unit-testable
load_into_database(db, accepted) -> int      # idempotent upsert by (brand_name, product_name)
load_product_associations(db, accepted)      # product_skin_types / product_concerns
write_ingest_report(accepted, rejected)      # training_dataset/processed/<name>_ingest_<ts>.json
run(db) / main()                             # same CLI entrypoint shape
```

`normalize_rows` maps each dataset's *real, inspected* columns onto the existing
target shape:

```
brand_name, product_name, category, product_url, image_url, price, currency,
volume_ml, ingredients, rating, review_count, skin_type_names, concern_names
```

Only rows identifiable as skincare (real category/type column values — never
guessed, AGENTS.md §0.2) are accepted; everything else is rejected with a reason,
same as `products.py`'s `"not a skincare product"` rejection. Category names map
through the same 7-value catalog `products.py._TERTIARY_CATEGORY_MAP` targets
(`Face Wash`, `Moisturizer`, `Sunscreen`, `Serum`, `Toner`, `Face Masks`,
`Treatment Products`, or `uncategorized` if no real match exists) — extended per
dataset only with mappings actually observed in that dataset's real values.

`load_into_database`'s existing `(brand_name, product_name)` dedupe is unchanged and
untouched — it already does the cross-dataset "matching" by construction: the same
brand+product landing from a second dataset is skipped, not double-inserted.

## Per-dataset phase (repeated 7 times, each independently committable)

1. `kaggle datasets download` into `training_dataset/raw/<slug>/`, unzip.
2. Verify via Chrome extension: license, real column names, row count, missing-value
   shape — write `training_dataset/raw/<slug>/dataset_info.json` (name, source,
   Kaggle URL, download date, license, file/row/column counts) and `schema.json`
   (per-column dtype, nullable, unique count, 3 examples).
3. Write `column_mapping.json` (source column → target field) from real inspection —
   this doc's contents are also this dataset's `master_product_schema.md` entry.
4. Write `normalize_rows()` + category/skin-type/concern maps built only from values
   actually observed in the data (no guessed categories).
5. Unit test: `backend/tests/test_<slug>_ingest.py`, fixture-CSV based, no network —
   same shape as `test_products_ingest.py`.
6. Add Makefile target `ingest-<slug>` (mirrors `ingest-products`).
7. Run the real ingest against local Postgres; record accepted/rejected/created
   counts from the real run (not asserted — copied from actual output).
8. `training_dataset/MANIFEST.md`: add the row, `docs/DATASETS_AND_APIS.md`: add a
   real entry (currently has zero mentions of any of these 7).
9. Commit on a feature branch → merge to local `dev` → delete branch.

## Cross-cutting artifacts (after all 7 phases)

- **`missing_data_report.md`** (`training_dataset/processed/`) — aggregates each
  run's real accepted/rejected/rejection-reason counts across all 7 datasets (plus
  the 2 existing ones) into one table. Generated from the existing per-run JSON
  reports, not recomputed.
- **`master_product_schema.md`** (`training_dataset/`) — documents the one real
  target shape (points at `database_schemas/` + the `Product`/`Ingredient` models as
  canonical) and includes each dataset's `column_mapping.json` inline as a per-source
  section. Not a new schema — a map of 9 sources onto the existing one.
- **Link verification** — one script,
  `backend/app/services/admin/ingest/verify_product_links.py`: HEAD-request (with
  timeout, retry+backoff, concurrency cap) every distinct non-null
  `products.image_url` and `products.product_url` currently in Postgres. Outputs
  `training_dataset/processed/broken_images.csv` and `broken_urls.csv`. New Makefile
  target `verify-product-links`, run manually (not part of any ingest run — network
  flakiness shouldn't block ingestion).
- **`normalized_ingredients.csv`** (`training_dataset/processed/`) — a plain export
  of the (already-normalized-on-ingest) `ingredients` table. Not a new normalization
  pass.

## Docs updated in the same changes

- `training_dataset/MANIFEST.md` — rows 5–11.
- `docs/DATASETS_AND_APIS.md` — real entries for all 7 (currently absent entirely).
- `docs/DECISIONS.md` — one ADR: "7 additional Kaggle product datasets ingested via
  the existing per-dataset ingest-module pattern; exact-match dedupe only, no fuzzy
  matching" (structural addition of new data sources, per AGENTS.md §6).
- `PROGRESS.md` — real completed/remaining state per dataset, honestly reported (no
  dataset marked done unless its real ingest run actually completed).
- `training_dataset/README.md` — its existing "Status" table gets a real row per
  dataset (same format as the current Sephora/Cosmetics/ISIC-2019 rows), not the repo
  root `README.md` (which carries no dataset detail today).

## Git workflow

Per-phase feature branches off local `dev` (e.g. `feature/dataset-open-beauty-facts`),
merged to local `dev` and deleted once that phase's tests + real ingest run pass.
`dev` is never pushed. `main` is never touched. `satya-sai-tharun-skinlytics` is not
touched until explicitly requested after this session's work is reviewed.

## Testing / definition of done (per dataset)

- `normalize_rows()` unit test passes against a small real-shaped fixture.
- Real Kaggle download succeeds (or `KaggleCredentialsError`/download failure is
  reported honestly, not masked).
- Real ingest run against local Postgres completes; accepted/rejected/created counts
  are copied from actual output, never invented.
- `ruff` + `mypy --strict` + `pytest` pass for backend changes touched.
- `MANIFEST.md` + `DATASETS_AND_APIS.md` rows added for that dataset in the same
  commit group.

## Open risks / things that can still block a phase

- A dataset's real columns may not carry any reliable skincare-category signal (e.g.
  general "Beauty" categories mixing makeup/haircare/skincare) — if so, the phase
  stops and asks rather than guessing a category split (AGENTS.md §0.2).
- Large datasets (e.g. Open Beauty Facts, Amazon Beauty Products) may be multi-GB —
  confirm size before pulling, same caution `MANIFEST.md` already applies to ISIC-2019.
- License terms differ per dataset; each phase's `dataset_info.json` records the real
  license found on the Kaggle page, not an assumption.
