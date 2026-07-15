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
| 1 | Sephora Products & Skincare Reviews | `nadyinky/sephora-products-and-skincare-reviews` | `training_dataset/raw/sephora/` | `product_info.csv` | `backend/app/services/admin/ingest/products.py` → `products`/`ingredients`/`product_ingredients` (Postgres) | Pipeline built. Credential-blocked until `KAGGLE_USERNAME`/`KAGGLE_KEY` are set in `.env.development`. |
| 2 | Cosmetics Datasets | `kingabzpro/cosmetics-datasets` | `training_dataset/raw/cosmetics/` | `cosmetics.csv` (verify exact name after download — Kaggle listing doesn't fix this) | No ingest pipeline yet — landing only. `AI_ML.md`/`AI_Skin_Datasets_APIs_Research.docx` list it as a secondary product/ingredient source, not the primary one (that's #1). | Not attempted. Same credential block as #1. |
| 3 | ISIC 2019 (Kaggle mirror) | `salviohexia/isic-2019-skin-lesion-images-for-classification` | `training_dataset/raw/isic-2019/` | image folders + a ground-truth CSV (varies by mirror) | `ml/` training data (not built — no `SkinTypeClassifier`/`ConcernDetector` training pipeline exists yet, see `docs/AI_ML.md`). Milestone 2 itself uses "Scikit-learn / Custom Rule Algorithms" for concern severity, not image classification — this dataset is **not** a Milestone 2 blocker. | Not attempted, out of scope for M2. Large download (multi-GB) — confirm before pulling. |

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

## How to actually download #1–#3

1. Get a Kaggle API token: kaggle.com → Account → Create New Token.
2. Put `KAGGLE_USERNAME`/`KAGGLE_KEY` into `.env.development` (already has the blank
   keys at the "External data sources" section) — never commit real values.
3. Dataset #1: `make ingest-products` (downloads, normalizes, upserts into Postgres —
   safe to re-run).
4. Datasets #2/#3: no pipeline exists yet; a plain `kaggle datasets download -d
   <slug> -p training_dataset/raw/<folder> --unzip` lands the raw files without any
   normalization/DB write. Confirm before running #3 — it's a large download.
