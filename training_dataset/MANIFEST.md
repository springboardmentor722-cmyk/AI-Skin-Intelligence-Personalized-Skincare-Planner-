# training_dataset/ — dataset manifest

Canonical list of external datasets this project uses, where each one lands, and
exactly what filename(s) to expect. Read `docs/DATASETS_AND_APIS.md` first for
access method/licensing detail per source — this file is just the concrete
folder/filename contract so downloads (manual or scripted) land in a place the
ingest code already looks for them.

**Rule:** if a dataset a pipeline depends on isn't actually present under its
folder below, say so and ask — don't assume it's there, don't fabricate rows to
fill the gap. See `AGENTS.md` §0.1.

| # | Dataset | Kaggle slug | Target folder | Expected primary file | Consumed by | Status |
|---|---|---|---|---|---|---|
| 1 | Sephora Products & Skincare Reviews | `nadyinky/sephora-products-and-skincare-reviews` | `training_dataset/raw/sephora/` | `product_info.csv` | `backend/app/services/admin/ingest/products.py` → `products`/`ingredients`/`product_ingredients` (Postgres) | **Ingested 2026-08-02** — 2,409 real skincare products loaded (`make ingest-products`). Has no image column at all (confirmed by inspecting every header + a data sample, not assumed) — see #4 for the image gap. |
| 2 | Cosmetics Datasets | `kingabzpro/cosmetics-datasets` | `training_dataset/raw/cosmetics/` | `cosmetics.csv` (verify exact name after download — Kaggle listing doesn't fix this) | No ingest pipeline yet — landing only. `AI_ML.md`/`AI_Skin_Datasets_APIs_Research.docx` list it as a secondary product/ingredient source, not the primary one (that's #1). | Downloaded 2026-08-02 while researching image sources; also has no image column. Not ingested — no pipeline exists for it. |
| 3 | ISIC 2019 (Kaggle mirror) | `salviohexia/isic-2019-skin-lesion-images-for-classification` | `training_dataset/raw/isic-2019/` | image folders + a ground-truth CSV (varies by mirror) | `ml/` training data (not built — no `SkinTypeClassifier`/`ConcernDetector` training pipeline exists yet, see `docs/AI_ML.md`). Milestone 2 itself uses "Scikit-learn / Custom Rule Algorithms" for concern severity, not image classification — this dataset is **not** a Milestone 2 blocker. | Not attempted, out of scope for M2. Large download (multi-GB) — confirm before pulling. |
| 4 | Sephora Products (image backfill only) | `yamqwe/sephora-products` | `training_dataset/raw/sephora-images/` | `sephora.csv` | `backend/app/services/admin/ingest/enrich_product_images.py` → downloads + re-hosts through `app/core/storage.py`, backfills `products.image_url` (an S3 key, not the source URL) only, exact-match by normalized (brand, product_name) against dataset #1's already-ingested rows | **Ingested 2026-08-02** (`make enrich-product-images`) — 39/2,409 products matched, downloaded, and re-hosted in this app's own storage (ADR-040/041). Small overlap by design: only the same SKU appearing in both scrapes matches; no fuzzy matching, to avoid ever showing a different real product's photo. Live hotlinking to Sephora's CDN was considered and rejected as not production-safe. |
| 5 | Skincare Products Clean Dataset | `eward96/skincare-products-clean-dataset` | `training_dataset/raw/skincare-clean/` | `skincare_products_clean.csv` | `backend/app/services/admin/ingest/ingest_skincare_clean.py` → `products`/`ingredients`/`product_ingredients` (Postgres) | **Ingested 2026-08-03** — 1,138 lookfantastic.com-scraped skincare products loaded (`make ingest-skincare-clean`). No brand_name column in source — brand extracted from product_name via longest-match-first against ~35 known multi-word brands (La Roche-Posay, Elizabeth Arden, First Aid Beauty, etc.), with fallback to "The X" pattern, then single leading word. GBP pricing (£ symbol, requires latin-1 encoding). Zero nulls in any column. |
| 6 | E-Commerce Cosmetics Dataset | `devi5723/e-commerce-cosmetics-dataset` | `training_dataset/raw/ecommerce/` | `E-commerce  cosmetic dataset.csv` (note: real filename has a double space) | `backend/app/services/admin/ingest/ingest_ecommerce_cosmetics.py` → `products`/`ingredients`/`product_ingredients` (Postgres, skincare category only) | **Ingested 2026-08-03** — 1,838 Amazon/Flipkart/Sephora/Ulta India-scraped skincare products loaded (`make ingest-ecommerce-cosmetics`). Of 12,615 total rows, 2,077 are category=="skincare"; the other 5 categories (body/lips/eyes/face/hair) are rejected, never guessed into skincare. INR pricing throughout. Real subcategory values (8, all mapped): serum/moisturizer/cleanser/face wash/mask/toner/eye treatment/spray — spray maps to "uncategorized". Requires latin-1 encoding. |
| 7 | Skincare Products and Ingredients | `autumndyer/skincare-products-and-ingredients` | `training_dataset/raw/skincare-ingredients/` | `Sephora_all_423.csv` (1 of 5 files ingested; other 4 landing-only: Paula_SUM_LIST.csv ingredient dictionary, embeddings, binary ingredient flatten, substitution pairs — none product-shaped) | `backend/app/services/admin/ingest/ingest_skincare_ingredients.py` → `products`/`product_skin_types` (Postgres) | **Ingested 2026-08-03** — 1,051 new products ingested, 1,125 duplicates skipped, 3 rejected (mandatory field missing). 2,179 total rows from an independently-scraped Sephora catalog (confirmed distinct from #1's nadyinky dataset: different field set entirely, no product_id/brand_id). Includes the 5 real seeded skin-type names (Dry/Oily/Combination/Normal/Sensitive), matched from free-text `Skin Type` column; `ingredients` column is unparsed marketing prose (not a clean INCI list), intentionally left empty in DB — no reliable parse boundary (`make ingest-skincare-ingredients`). |
| 8 | Open Beauty Facts | `openfoodfacts/openbeautyfacts` | `training_dataset/raw/open-beauty-facts/` | `en.openbeautyfacts.org.products.tsv` | None — landing only | **Downloaded 2026-08-03, landing only** — 4,304 rows, no price field anywhere in the dataset (fails the mandatory-field gate every other dataset here honors), dominated by non-skincare categories. No ingest pipeline built. |
| 9 | Dermstore Skincare Products & Ingredients | `crawlfeeds/dermstore-skincare-products-and-ingredients-dataset` | `training_dataset/raw/dermstore/` | `dermstore_data.json` | None — landing only | **Downloaded 2026-08-03, landing only** — 126 rows, not skincare-exclusive, no reliable category signal (per-product breadcrumb only). No ingest pipeline built. |

## Sources this project deliberately does NOT bulk-download

Per `docs/DATASETS_AND_APIS.md` and `AI_Skin_Datasets_APIs_Research.docx` — websites
with no public API, or copyrighted content. Do not write a scraper for these:

- **INCIDecoder** (`incidecoder.com`), **COSDNA** (`cosdna.com`), **EU CosIng** — no
  API. Ingredient master stays hand-curated (`backend/app/db/seed.py`).
- **DermNet** (`dermnetnz.org`), **AAD** (`aad.org`) — copyrighted; store only short
  summaries + source link if ever ingested, never full articles.
- **Google Scholar** — no API; use Semantic Scholar / OpenAlex / Crossref instead
  (already wired for PubMed, `backend/app/db/ingest_knowledge.py`).
- **ISIC Archive proper** (`isic-archive.com`, the non-Kaggle original) — has a real
  public API for metadata/images, distinct from dataset #3 above (a Kaggle mirror).
  Not wired; only relevant once real CNN training is in scope.

## How to actually download #1–#4

1. Get a Kaggle API token: kaggle.com → Account → Create New Token.
2. Put `KAGGLE_USERNAME`/`KAGGLE_KEY` into `.env.development` (already has the blank
   keys at the "External data sources" section) — never commit real values.
3. Dataset #1: `make ingest-products` (downloads, normalizes, upserts into Postgres —
   safe to re-run, dedupes by brand+name+size).
4. Dataset #4: `make enrich-product-images` (downloads, matches, backfills
   `image_url` only — safe to re-run, only ever touches rows where it's still NULL).
   Run #1 first; #4 has nothing to match against otherwise.
5. Dataset #2: no pipeline exists yet; a plain `kaggle datasets download -d
   <slug> -p training_dataset/raw/<folder> --unzip` lands the raw files without any
   normalization/DB write.
6. Dataset #3: same manual download as #2 — confirm before running, it's a large
   (multi-GB) download.
