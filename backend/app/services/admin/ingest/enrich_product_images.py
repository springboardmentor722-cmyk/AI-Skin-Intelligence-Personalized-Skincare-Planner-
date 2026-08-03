# source: docs/DATASETS_AND_APIS.md "2. Product database" note extended 2026-08-02 —
# nadyinky/sephora-products-and-skincare-reviews (this pipeline's primary catalog
# source, products.py) has no image column at all; researched 9 alternative Kaggle
# datasets before finding one usable for real (not fabricated) image backfill.
# Extended 2026-08-04 (ADR-044): the catalog grew from 2,409 to 6,699 rows (datasets
# #5/#6/#7) since this last ran, and a re-audit of all 9 datasets in
# training_dataset/MANIFEST.md found two more already-downloaded, unused sources with
# real image columns — #8 Open Beauty Facts and #9 Dermstore — landing-only for
# product ingest (wrong shape/coverage to be a primary catalog source) but perfectly
# usable here, same exact-match-only discipline.
"""One-off enrichment — `make enrich-product-images` /
`python -m app.services.admin.ingest.enrich_product_images`.

Backfills `products.image_url` for rows the primary ingest (`products.py`) leaves
NULL, by matching against three sources in turn — `yamqwe/sephora-products` (a
separate, smaller Kaggle scrape of the same retailer), then the already-downloaded,
unused-for-product-ingest Dermstore and Open Beauty Facts datasets (training_dataset/
MANIFEST.md #9/#8) — each pass only sees rows the previous pass left NULL. Matching is
exact normalized (brand_name, product_name) only — no fuzzy scoring — because a wrong
match here means showing a *different real product's* photo, which is worse than the
flask-icon placeholder it replaces. Expect a small match count relative to the
catalog: real coverage is bounded by how often the exact same (brand, product) pair
happens to appear in both this catalog and one of these independently-scraped
sources — never inflated by loosening the match.

**Images are downloaded once and re-hosted through this app's own storage adapter
(`app/core/storage.py`), never left as a live hotlink to Sephora's CDN** (ADR-041):
a production deployment can't depend on a third party's CDN staying up, keeping the
same file at the same path, or tolerating being hotlinked — and this app's storage
objects are private-by-design (`AGENTS.md`: "every read via `get_presigned_url`,
never a public bucket URL"), so `products.image_url` stores an **S3 object key**,
not a URL at all; `recommendations/service.py`'s `resolve_product_image_url` turns
that key into a fresh presigned URL at read time, every time (presigned URLs expire,
so one can never be computed once and stored).

Safe to re-run: only ever touches rows where `image_url IS NULL`, never overwrites
an existing value (a key already stored means that product's image already lives in
this app's own bucket — nothing left to fetch from Sephora for it).
"""

import csv
import json
import re
import urllib.request
from pathlib import Path
from urllib.error import URLError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.storage import FileValidationError, upload
from app.db.outbox import append_outbox
from app.services.admin.ingest.products import KaggleCredentialsError
from app.services.recommendations.models import Product

# infra doc's own image allowlist (app/core/storage.py's VERIFICATION_DOCUMENT_
# CONTENT_TYPES includes PDF too, which makes no sense for a product photo — this
# pipeline needs its own narrower allowlist, not that one).
_ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

_DATASET_SLUG = "yamqwe/sephora-products"
_PRIMARY_CSV = "sephora.csv"
_RAW_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "sephora-images"
_REQUEST_TIMEOUT_SECONDS = 10

_TRAINING_DATASET_RAW = Path(__file__).resolve().parents[5] / "training_dataset" / "raw"
_DERMSTORE_JSON_PATH = _TRAINING_DATASET_RAW / "dermstore" / "dermstore_data.json"
_OPEN_BEAUTY_FACTS_TSV_PATH = (
    _TRAINING_DATASET_RAW / "open-beauty-facts" / "en.openbeautyfacts.org.products.tsv"
)


def download_dataset() -> Path:
    if not settings.kaggle_username or not settings.kaggle_key:
        raise KaggleCredentialsError(
            "KAGGLE_USERNAME/KAGGLE_KEY are blank in .env — see training_dataset/README.md "
            "for how to obtain and set a real Kaggle API token. Nothing else to fix in code."
        )

    import os

    os.environ["KAGGLE_USERNAME"] = settings.kaggle_username
    os.environ["KAGGLE_KEY"] = settings.kaggle_key
    from kaggle.api.kaggle_api_extended import KaggleApi

    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    api = KaggleApi()
    api.authenticate()
    api.dataset_download_files(_DATASET_SLUG, path=str(_RAW_DIR), unzip=True)
    return _RAW_DIR / _PRIMARY_CSV


def normalize(name: str) -> str:
    """brand/product-name key: lowercase, strip punctuation, collapse whitespace —
    matches this dataset's actual noise (case differences, stray symbols) without
    being loose enough to conflate two different real products."""
    lowered = name.lower().strip()
    stripped = re.sub(r"[^a-z0-9 ]", "", lowered)
    return re.sub(r"\s+", " ", stripped)


def clean_image_url(raw: str) -> str | None:
    """yamqwe/sephora-products' own `images` column is ` ~ `-joined and every URL has
    a real scraping bug: the domain is duplicated (`sephora.comhttps://www.sephora.com/...`).
    Takes the first image and repairs the duplication; returns None for a genuinely
    empty cell (the dataset has plenty of those)."""
    if not raw:
        return None
    first = raw.split(" ~ ")[0].strip()
    first = first.replace("https://www.sephora.comhttps://", "https://")
    return first or None


def build_image_index(csv_path: Path) -> dict[tuple[str, str], str]:
    """Pure transform, no I/O beyond reading the given file — the part of this
    pipeline that's unit-testable without a live download or network call
    (tests/test_enrich_product_images.py), same discipline as products.py's
    normalize_rows(). Last write wins on a duplicate key — the source CSV has no
    reliable tiebreaker and a collision here just means one candidate photo is
    dropped, not a data-quality failure."""
    index: dict[tuple[str, str], str] = {}
    with open(csv_path, encoding="utf-8", newline="") as f:
        csv.field_size_limit(10_000_000)
        for row in csv.DictReader(f):
            image_url = clean_image_url(row.get("images", ""))
            brand = row.get("brand", "")
            name = row.get("product_name", "")
            if not image_url or not brand or not name:
                continue
            index[(normalize(brand), normalize(name))] = image_url
    return index


def clean_dermstore_image_url(raw: str) -> str | None:
    """training_dataset/raw/dermstore/dermstore_data.json's `images` field is a
    comma-joined string of 1+ CDN URLs — takes the first, same "one representative
    photo, not the whole gallery" choice as clean_image_url above."""
    if not raw:
        return None
    first = raw.split(",")[0].strip()
    return first or None


def build_image_index_dermstore(json_path: Path) -> dict[tuple[str, str], str]:
    """training_dataset/MANIFEST.md #9 — 126 rows, already downloaded, landing-only
    for product ingest (too small and not skincare-exclusive to be a primary catalog
    source, per its own dataset_info.json) but every row carries a real image — an
    unused, real image source this pipeline was missing until 2026-08-04 (ADR-044)."""
    with open(json_path, encoding="utf-8") as f:
        rows = json.load(f)
    index: dict[tuple[str, str], str] = {}
    for row in rows:
        image_url = clean_dermstore_image_url(row.get("images", ""))
        brand = row.get("brand", "")
        name = row.get("title", "")
        if not image_url or not brand or not name:
            continue
        index[(normalize(brand), normalize(name))] = image_url
    return index


def build_image_index_open_beauty_facts(tsv_path: Path) -> dict[tuple[str, str], str]:
    """training_dataset/MANIFEST.md #8 — 4,304 rows, already downloaded, landing-only
    for product ingest (no price field at all, fails every other dataset's
    mandatory-field gate; dominated by non-skincare categories) but 1,352 rows carry a
    real `image_url`. Co-branded rows (OpenFoodFacts' own comma-joined `brands`
    convention, e.g. "Revlon,Colorsilk") normalize to a string no real catalog brand
    equals, so they never match — not a special case, just the same exact-match
    discipline as the other two sources applied to this dataset's actual noise."""
    index: dict[tuple[str, str], str] = {}
    with open(tsv_path, encoding="utf-8", newline="") as f:
        csv.field_size_limit(10_000_000)
        for row in csv.DictReader(f, delimiter="\t"):
            image_url = (row.get("image_url") or "").strip()
            brand = row.get("brands", "")
            name = row.get("product_name", "")
            if not image_url or not brand or not name:
                continue
            index[(normalize(brand), normalize(name))] = image_url
    return index


def find_image_matches(
    products: list[tuple[int, str, str]], index: dict[tuple[str, str], str]
) -> list[tuple[int, str]]:
    """`products` is (product_id, brand_name, product_name) for rows with
    `image_url IS NULL`. Exact normalized-key match only — see module docstring for
    why this deliberately doesn't fuzzy-match."""
    matches: list[tuple[int, str]] = []
    for product_id, brand, name in products:
        key = (normalize(brand), normalize(name))
        image_url = index.get(key)
        if image_url:
            matches.append((product_id, image_url))
    return matches


def download_image_bytes(url: str) -> bytes | None:
    """Fetches the actual image, once, for re-hosting — not just a liveness check.
    A source-dataset image URL from a multi-year-old scrape that no longer resolves
    (or isn't actually an image anymore) returns None here rather than raising, so
    one dead link doesn't abort the whole run."""
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=_REQUEST_TIMEOUT_SECONDS) as response:
            if response.status != 200:
                return None
            data: bytes = response.read()
            return data
    except (URLError, OSError, ValueError):
        return None


async def run(db: AsyncSession) -> None:
    yamqwe_csv = download_dataset()
    # Priority order: yamqwe first (same retailer as the primary catalog, highest
    # trust), then the two local, already-downloaded, real-but-smaller sources. Each
    # source only ever sees rows the previous one left NULL (fresh query per source),
    # so this stays exactly as idempotent/re-runnable as the single-source version.
    sources: list[tuple[str, dict[tuple[str, str], str]]] = [
        (_DATASET_SLUG, build_image_index(yamqwe_csv)),
        (
            "dermstore (training_dataset/raw/dermstore)",
            build_image_index_dermstore(_DERMSTORE_JSON_PATH),
        ),
        (
            "openbeautyfacts (training_dataset/raw/open-beauty-facts)",
            build_image_index_open_beauty_facts(_OPEN_BEAUTY_FACTS_TSV_PATH),
        ),
    ]

    total_stored = 0
    total_dead = 0
    for source_name, index in sources:
        result = await db.execute(
            select(Product.product_id, Product.brand_name, Product.product_name).where(
                Product.image_url.is_(None)
            )
        )
        candidates = [(pid, brand or "", name or "") for pid, brand, name in result.all()]
        matches = find_image_matches(candidates, index)

        stored = 0
        dead = 0
        for product_id, source_url in matches:
            data = download_image_bytes(source_url)
            if data is None:
                dead += 1
                continue
            key = f"products/{product_id}/main"
            try:
                stored_key = await upload(
                    key, data, allowed_content_types=_ALLOWED_IMAGE_CONTENT_TYPES
                )
            except FileValidationError:
                dead += 1
                continue

            product = await db.get(Product, product_id)
            assert product is not None
            product.image_url = stored_key
            await append_outbox(db, "product", str(product_id), "upsert")
            stored += 1

        await db.commit()
        print(
            f"{source_name}: matched {len(matches)} product(s) by exact brand+name, "
            f"{stored} were downloaded and re-hosted in this app's own storage "
            f"({dead} matched but the source image was dead or invalid)."
        )
        total_stored += stored
        total_dead += dead

    print(
        f"Total: {total_stored} product(s) backfilled across all sources, "
        f"{total_dead} dead matches."
    )


async def main() -> None:
    from app.db.postgres import async_session_factory

    async with async_session_factory() as db:
        await run(db)


if __name__ == "__main__":
    import asyncio

    try:
        asyncio.run(main())
    except KaggleCredentialsError as exc:
        print(f"Blocked: {exc}")
