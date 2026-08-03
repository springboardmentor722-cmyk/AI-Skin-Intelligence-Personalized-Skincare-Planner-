# Dataset expansion: 5 additional Kaggle product/ingredient sources

Status: approved for planning · Date: 2026-08-03 · Owner: Satya Sai Tharun Jekkamsetti

## Goal

Add 5 new Kaggle product/ingredient datasets to `training_dataset/raw/`, and ingest
the skincare-relevant rows from each into the existing `products` /
`product_ingredients` / `ingredients` Postgres tables, using the same pattern
`backend/app/services/admin/ingest/products.py` already established for the Sephora
dataset. No new architecture, no new schema, no fuzzy-matching layer.

**Revision note (2026-08-03):** the original 7-dataset request included 4 dataset
URLs that turned out not to exist under the given slugs, verified live via the
Kaggle API and Kaggle dataset pages (not assumed) — `openfoodfacts/open-beauty-facts`,
`stephaniefong/ulta-beauty-products`, `PromptCloudHQ/amazon-beauty-products`, and
`ruchi798/skincare-products` all 404. The owner supplied 3 corrected replacement URLs;
one (`openfoodfacts/openbeautyfacts`, no hyphens) is the real Open Beauty Facts
dataset. The other two (`thaprinceali/sephora-product-case-study`,
`melissamonfared/sephora-skincare-reviews`) are real but — per their own dataset
descriptions — both republish the exact same `nadyinky/sephora-products-and-skincare-reviews`
scrape already ingested as `MANIFEST.md` #1; the owner confirmed skipping both rather
than spending a download+dedupe cycle on data already in Postgres. Net: 5 datasets,
down from 7.

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

## Datasets — final scope after real download + pandas inspection (2026-08-03)

All 5 were actually downloaded into `training_dataset/raw/` and inspected with real
pandas/json calls (not just Kaggle page previews) before this plan was written. That
inspection found 2 more fit problems beyond the URL corrections above — both resolved
with the owner before planning.

**Ingest modules built (3 real product-shaped sources):**

| # | Dataset | Kaggle slug | Target folder | Real columns (verified by inspection) | License |
|---|---|---|---|---|---|
| 5 | Skincare Products Clean Dataset | `eward96/skincare-products-clean-dataset` | `training_dataset/raw/skincare-clean/` | `product_name, product_url, product_type, clean_ingreds, price` — 1,138 rows, **zero nulls in any column**. Real `product_type` values (14, all observed): Mask(124), Body Wash(123), Moisturiser(115), Cleanser(115), Serum(113), Eye Care(100), Mist(80), Oil(76), Toner(73), Balm(61), Exfoliator(57), Bath Salts(36), Bath Oil(33), Peel(32). Price is GBP text (`£5.20`) — **must read the CSV with `encoding="latin-1"`, confirmed live: default UTF-8 mangles the `£` symbol.** | Unknown |
| 6 | Skincare Products and Ingredients (1 of 5 files only) | `autumndyer/skincare-products-and-ingredients`, file `Sephora_all_423.csv` | `training_dataset/raw/skincare-ingredients/` | `cosmetic_link, brand_name, cosmetic_name, num_customer, price, ingredients, about, reviews, recommended, What it is, Skin Type, Skincare Concerns, Formulation, ...` — 2,179 rows. **Confirmed a genuinely independent Sephora scrape, not a duplicate of nadyinky's already-ingested data** (entirely different field set: narrative `about`/`Skincare Concerns` text, `num_customer`, no `product_id`/`brand_id` at all). `price` is text, sometimes a range (`"$16.00 - $35.00"`) — needs custom parsing (take the low end). The other 4 files in this dataset (`Paula_SUM_LIST.csv` = a 26,087-row ingredient dictionary with no products at all, `Paula_embedding_SUMLIST_before_422.csv` = embeddings, `binary_cosmetic_ingredient.csv` = a redundant product×ingredient flatten, `pre_alternatives.csv` = ingredient-substitution pairs) are **not product-catalog-shaped — landed raw only, no ingest module**, owner-confirmed. | MIT |
| 7 | E-Commerce Cosmetics Dataset | `devi5723/e-commerce-cosmetics-dataset` | `training_dataset/raw/ecommerce/` | Real columns (differ from the Kaggle page's prose description — verified from the actual header): `product_name, website, country, category, subcategory, title-href, price, brand, ingredients, form, type, color, size, rating, noofratings` — 12,615 rows total, **2,077 with real `category == "skincare"`**. Real `subcategory` values within skincare (all observed): serum(817), moisturizer(404), cleanser(281), mask(172), face wash(172), toner(128), eye treatment(73), spray(30). Price is numeric INR throughout (per the dataset's own description). **Also needs `encoding="latin-1"`** — hit a real `UnicodeDecodeError` on default UTF-8. | MIT |

**Landing-only, no ingest module (poor product-catalog fit, owner-confirmed):**

| # | Dataset | Kaggle slug | Target folder | Why landing-only |
|---|---|---|---|---|
| 8 | Open Beauty Facts | `openfoodfacts/openbeautyfacts` | `training_dataset/raw/open-beauty-facts/` | 4,304 rows, but **the dataset has no price field at all** (Open Food Facts' nutrition-style schema, not retail) — every row would fail the same mandatory-field gate every other dataset here honors (`brand_name`/`product_name`/`price`). Also dominated by hair/soap/toothpaste/nail-polish/perfume categories (French-heavy crowdsourced data); skincare ("Visage") is a small minority, with 39–69% missingness on category/ingredients/image fields. |
| 9 | Dermstore Skincare Products & Ingredients | `crawlfeeds/dermstore-skincare-products-and-ingredients-dataset` | `training_dataset/raw/dermstore/` | Only 126 rows, not skincare-exclusive (includes a hair comb, candles, hair straighteners, LED devices, foundation makeup). The `category` field is a useless per-product breadcrumb (`"Brands / X / Y"`, 126 unique values). `range`/`skin_type_and_concerns` are 58–65% null with no reliable skincare/not-skincare signal — building a keyword classifier here would be exactly the guessing AGENTS.md §0.2 rules out. |

(Numbering continues from `MANIFEST.md`'s existing 1–4.) Two datasets from the
original 7-dataset ask were dropped earlier as confirmed duplicates of already-ingested
data — see the revision note above. All 5 raw datasets (including the 2 landing-only
ones and autumndyer's 4 non-ingested files) were already downloaded into
`training_dataset/raw/` during this inspection pass.

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

## Per-dataset phase — 3 ingest phases (all raw data already downloaded and inspected)

1. Raw data already landed in `training_dataset/raw/<slug>/` and real
   columns/values already inspected (see table above) — no re-download needed.
2. Write `dataset_info.json` (name, source, Kaggle URL, download date, license,
   file/row/column counts — real numbers, from the table above) and `schema.json`
   (per-column dtype, nullable, unique count, 3 real examples).
3. Write `column_mapping.json` (source column → target field), using the real
   columns/values already recorded above — this file's contents are also this
   dataset's `master_product_schema.md` entry.
4. Write `normalize_rows()` + category maps using only the real observed values
   recorded above (no guessed categories, no unobserved product_type/subcategory
   values invented).
5. Unit test: `backend/tests/test_<slug>_ingest.py`, fixture-CSV based (rows drawn
   from the real samples already captured), no network — same shape as
   `test_products_ingest.py`.
6. Add Makefile target `ingest-<slug>` (mirrors `ingest-products`).
7. Run the real ingest against local Postgres; record accepted/rejected/created
   counts from the real run (not asserted — copied from actual output).
8. `training_dataset/MANIFEST.md`: add the row, `docs/DATASETS_AND_APIS.md`: add a
   real entry.
9. Commit on a feature branch → merge to local `dev` → delete branch.

The 2 landing-only datasets (Open Beauty Facts, Dermstore) and autumndyer's 4
non-ingested files skip steps 3–7 entirely — they get a `MANIFEST.md` row marked
"landing only" (same treatment as the existing Cosmetics dataset #2) and nothing
else; no ingest module, no test, no Makefile target.

## Cross-cutting artifacts (after the 3 ingest phases)

- **`missing_data_report.md`** (`training_dataset/processed/`) — aggregates each
  run's real accepted/rejected/rejection-reason counts across all 5 new datasets
  (plus the 2 existing ones) into one table. Generated from the existing per-run JSON
  reports, not recomputed.
- **`master_product_schema.md`** (`training_dataset/`) — documents the one real
  target shape (points at `database_schemas/` + the `Product`/`Ingredient` models as
  canonical) and includes each dataset's `column_mapping.json` inline as a per-source
  section. Not a new schema — a map of 7 sources onto the existing one.
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

- `training_dataset/MANIFEST.md` — rows 5–9 (3 ingested, 2 landing-only).
- `docs/DATASETS_AND_APIS.md` — real entries for all 5 (currently absent entirely).
- `docs/DECISIONS.md` — one ADR: "5 additional Kaggle datasets landed; 3 ingested
  into products/ingredients via the existing per-dataset ingest-module pattern
  (exact-match dedupe only, no fuzzy matching), 2 landing-only after real
  inspection found no usable mandatory-field/category signal (Open Beauty Facts has
  no price column; Dermstore has no reliable skincare-category field); 2 requested
  Sephora-derivative datasets and 3 nonexistent dataset URLs from the original ask
  excluded" (structural addition of new data sources, per AGENTS.md §6).
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

## Testing / definition of done (per ingested dataset)

- `normalize_rows()` unit test passes against a small real-shaped fixture.
- Real Kaggle download succeeds (or `KaggleCredentialsError`/download failure is
  reported honestly, not masked).
- Real ingest run against local Postgres completes; accepted/rejected/created counts
  are copied from actual output, never invented.
- `ruff` + `mypy --strict` + `pytest` pass for backend changes touched.
- `MANIFEST.md` + `DATASETS_AND_APIS.md` rows added for that dataset in the same
  commit group.

## Open risks / things that can still block a phase

- `Sephora_all_423.csv`'s `price` field is sometimes a range (`"$16.00 - $35.00"`
  for products with size/shade variants) — the plan takes the low end, consistent
  with treating price as "starting price," not an invented average.
- License terms differ per ingested dataset (Unknown / MIT — see table above,
  already verified from real Kaggle pages, not assumed).
- Both `eward96` and `devi5723` CSVs require `encoding="latin-1"` to read correctly
  (confirmed live — default UTF-8 either mangles the `£` symbol or raises
  `UnicodeDecodeError` outright, depending on the file).
