# Datasets & external APIs — single lookup

The canonical registry of every external data source and API in Skinlytics. **Agents:
before writing any ingestion script or external adapter, look the source up here first**
— use the access method, env var, target store, and caveats below. Each adapter cites
this file at the top (`# source: docs/DATASETS_AND_APIS.md → <section>`).

> Two rules that override convenience:
> 1. **Respect licensing & ToS.** Several sources are websites with no API — scraping them
>    may violate their terms. Where marked "no API / do not scrape", use the recommended
>    open alternative. Store links + short summaries, never copyrighted full text.
> 2. **Keys live in `.env`, never in code.** Adapters read them via `app/core/config.py`.

## Quick index
| Category | Source | Type | Key | Target store | Adapter |
|---|---|---|---|---|---|
| Skin images | ISIC Archive | API + bulk dataset | no (API) / account (bulk) | S3 + Mongo `skin_assessments`; training in `ml/` | `ml/data/isic.py` |
| Skin images | Kaggle facial skin-type sets | dataset download | Kaggle token | `ml/` training data | `ml/data/kaggle.py` |
| Products | Kaggle (Sephora / cosmetics sets) | dataset download | Kaggle token | PG `products`, `product_ingredients` | `backend/app/services/admin/ingest/products.py` |
| Ingredients | INCIDecoder, COSDNA | website — **no API** | — | PG `ingredients` (curated) | `backend/app/services/admin/ingest/ingredients.py` |
| Derm knowledge | DermNet, AAD | website — **copyrighted** | — | Mongo `knowledge_articles` (summaries + links) | `backend/app/services/admin/ingest/knowledge.py` |
| Weather & UV | OpenWeather One Call | REST | `OPENWEATHER_API_KEY` | Redis cache + Mongo `weather_uv_logs` | `backend/app/integrations/openweather.py` |
| Weather & UV | OpenUV | REST | `OPENUV_API_KEY` | same | `backend/app/integrations/openuv.py` |
| Lifestyle | in-app forms | internal | — | Mongo `lifestyle_logs` | Skin Profile Service |
| Progress | generated internally | internal | — | Mongo `progress_logs` + S3 | Progress Tracking Service |
| Research | PubMed (E-utilities) | REST | `NCBI_API_KEY` (optional) | Mongo `knowledge_articles` + ES + vector | `backend/app/integrations/pubmed.py` |
| Research | Semantic Scholar / OpenAlex / Crossref | REST | optional | same | `backend/app/integrations/scholarly.py` |

## Adapter contract & ops defaults (applies to every integration)
```python
# backend/app/integrations/base.py
class Adapter(Protocol):
    source: str                      # matches a section in this file
    async def fetch(self, req) -> AdapterResult: ...   # normalized, validated output
```
- **Resilience:** 10 s timeout · 3 retries, exponential backoff + jitter · circuit breaker
  (open after 5 consecutive failures, half-open probe after 60 s).
- **Caching (Redis):** weather/UV `weather:cache:{geo}` 30 min (round coords to ~city
  precision — better cache hits, less location granularity stored) · research lookups
  24 h · product/ingredient ingests are batch jobs, not request-path calls.
- **Fallback chains:** OpenWeather ⇄ OpenUV for UV; Semantic Scholar → OpenAlex →
  Crossref for scholarly metadata.
- **Data-quality gates on ingest:** schema-validate rows; dedupe (products by
  brand+name+size; ingredients by INCI name); normalize units/currency; reject rows
  missing mandatory fields; log a per-run ingest report.
- **License ledger:** every ingested record stores `source`, `source_url`, `license`,
  `ingested_at`. No license recorded → not ingested.
- **PII:** external sources contain none; user images/lifestyle data are internal-only
  and never sent to third parties.

---

## 1. Skin images
### ISIC Archive — `https://api.isic-archive.com` · docs: `/api/docs/swagger/`
- **Use:** training data for `SkinTypeClassifier` / `ConcernDetector` (M2+). Public REST
  API for metadata + images; large challenge datasets downloadable.
- **Scope caveat:** ISIC is **dermoscopic lesion** imagery (melanoma/skin-cancer focused),
  not selfie/facial skin — strong for lesion & condition detection, **not** facial
  skin-type classification. Use facial datasets (below) for that; mind the domain gap
  (`AI_ML.md` model cards).
- **Licensing:** per collection (CC-0 / CC-BY / CC-BY-NC) — check each; keep the license
  id with stored metadata (ledger rule).
- **Access:** no key for the public API; free account raises limits / enables bulk export.

### Kaggle facial skin-type datasets
- **Use:** facial skin-type/concern training images; also the source for the
  **tone-balanced fairness eval set** (`AI_ML.md`) — verify tone coverage before use.
- **Access:** Kaggle token (`~/.kaggle/kaggle.json` or `KAGGLE_USERNAME`/`KAGGLE_KEY`);
  `kaggle datasets download -d <slug>`. Verify each dataset's license (CC0/CC-BY common).

## 2. Product database — Kaggle (Sephora / cosmetics sets)
- **Use:** seed `products` + `product_ingredients` (M1 "prepare initial database") and
  reviews/ratings for popularity features.
- **Pipeline:** download → normalize (brand, name, category, price, size) → upsert
  `products`; parse ingredient text (INCI lists are messy — strip parentheticals, split
  on commas, canonicalize casing) → upsert `ingredients` → link `product_ingredients`.
  Idempotent (`make seed` safe to re-run).
- **Licensing:** per dataset; record the source. Prices in ₹ with `currency` stored —
  convert once at ingest, not at read.

## 3. Ingredient database — INCIDecoder, COSDNA
- **Sites:** `https://incidecoder.com`, `https://cosdna.com`
- **Use:** authoritative ingredient facts (INCI names, functions, irritancy) to enrich
  `ingredients` + ES prose.
- **⚠ No public API. Do not scrape at scale** — ToS/robots almost certainly prohibit it.
  **Approach:** build the ingredient master from open Kaggle ingredient datasets, then use
  these sites as a *human* reference to manually curate the PDF's 8 categories (Retinoids,
  Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/BHAs)
  and populate `ingredient_concern_treats` / `ingredient_skintype_avoid`. Curated rows are
  the backbone of allergy/interaction safety — quality over quantity.
- Need automated ingredient data later → obtain a licensed feed, don't scrape.

## 4. Dermatology knowledge — DermNet, AAD
- **Sites:** `https://dermnetnz.org`, `https://aad.org`
- **Use:** condition explanations, ingredient education, `related_conditions` for the
  knowledge base and the NLP/embedding corpus.
- **⚠ Copyrighted.** Do **not** ingest full articles. Store **short summaries + source
  link + tags** in Mongo `knowledge_articles`; embed only licensed text. DermNet's ML
  image dataset has its own terms — check before training on it.

## 5. Weather & UV
### OpenWeather One Call — `https://openweathermap.org/api/one-call-3` (or 4.0)
- **Use:** current + forecast weather and **UV index** (`uvi`) for
  `environmental_exposure` features and sun/UV reminders.
- **Important:** the standalone UV Index API was retired (2021) — UV comes from One Call
  3.0/4.0. "One Call by Call" subscription: ~1,000 calls/day free, pay-per-use above —
  verify current pricing at the docs before relying on it. `OPENWEATHER_API_KEY`.
- **Storage:** Redis cache (30 min) → persist to Mongo `weather_uv_logs` (TTL 90 days).

### OpenUV — `https://www.openuv.io` · docs: `/#api`
- **Use:** dedicated real-time UV + safe-exposure times; complement/fallback to
  OpenWeather. `OPENUV_API_KEY`; free tier is capped daily — budget calls via the cache.
- Pick one as primary per env config; the adapter pair implements the fallback chain.

## 6. User lifestyle — in-app forms
Sleep, water intake, exercise, stress, diet, environmental exposure (PDF Module 2, M1
tasks 8–9). Collected by the Skin Profile Service → Mongo `lifestyle_logs` (one/day
upsert). No external source, no key.

## 7. Progress tracking — generated internally
Before/after photos + improvement scores from the Progress Tracking Service; images → S3
(EXIF stripped, signed URLs), records → Mongo `progress_logs`. No external source.

## 8. Research
### PubMed — NCBI E-utilities · `https://www.ncbi.nlm.nih.gov/books/NBK25501/`
- **Use:** peer-reviewed abstracts/metadata for evidence links (`research_refs`,
  `ingredient_concern_treats.evidence_strength`) and the articles vector namespace
  (PubMedBERT).
- **Access:** free `esearch`/`efetch`; `NCBI_API_KEY` raises 3 → 10 req/s. Store
  abstract + PMID + link in Mongo `knowledge_articles`.

### Google Scholar — ⚠ no official API; do not scrape
Use instead (all programmatic, license-friendly): **Semantic Scholar**
(`https://api.semanticscholar.org`, key optional) · **OpenAlex**
(`https://api.openalex.org`, no key) · **Crossref** (`https://api.crossref.org`, no key).
All research ingestion routes through `scholarly.py` with the fallback chain above;
Scholar remains a manual human reference only.

---

## Environment variables (`.env`, mirrored in `.env.example`)
```
KAGGLE_USERNAME=            KAGGLE_KEY=
OPENWEATHER_API_KEY=
OPENUV_API_KEY=
NCBI_API_KEY=               # optional, raises PubMed limit
SEMANTIC_SCHOLAR_API_KEY=   # optional
# ISIC public API + OpenAlex + Crossref need no key
```

## Milestone mapping
- **M1:** seed `products`/`ingredients`/`product_ingredients` from Kaggle + curated
  INCIDecoder/COSDNA references; wire OpenWeather/OpenUV adapters (cached). No training.
- **M2–M3:** ISIC/Kaggle image training (with the tone-balanced eval set);
  PubMed/Semantic Scholar/OpenAlex ingestion into `knowledge_articles` + vector;
  product/ingredient embeddings for the recommendation pipeline (via the outbox,
  ADR-010).
