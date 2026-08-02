# source: docs/DATASETS_AND_APIS.md "2. Product database" note extended 2026-08-02 —
# nadyinky/sephora-products-and-skincare-reviews (this pipeline's primary catalog
# source, products.py) has no image column at all; researched 9 alternative Kaggle
# datasets before finding one usable for real (not fabricated) image backfill.
"""One-off enrichment — `make enrich-product-images` /
`python -m app.services.admin.ingest.enrich_product_images`.

Backfills `products.image_url` for rows the primary ingest (`products.py`) leaves
NULL, by matching against `yamqwe/sephora-products` — a separate, smaller Kaggle
scrape of the same retailer that happens to carry real image URLs. Matching is exact
normalized (brand_name, product_name) only — no fuzzy scoring — because a wrong
match here means showing a *different real product's* photo, which is worse than the
flask-icon placeholder it replaces. Expect a small match count (tens, not thousands):
the two datasets only overlap where the same SKU happens to appear in both scrapes.

Each matched URL is verified live (HTTP HEAD) before being written — the source
dataset was scraped years ago and Sephora's CDN does drop images over time, so a
match with no verification would trade one broken-image class for another.

Safe to re-run: only ever UPDATEs rows where `image_url IS NULL`, never overwrites
an existing value.
"""

import csv
import re
import urllib.request
from pathlib import Path
from urllib.error import URLError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.outbox import append_outbox
from app.services.admin.ingest.products import KaggleCredentialsError
from app.services.recommendations.models import Product

_DATASET_SLUG = "yamqwe/sephora-products"
_PRIMARY_CSV = "sephora.csv"
_RAW_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "sephora-images"
_REQUEST_TIMEOUT_SECONDS = 10


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


def verify_url_live(url: str) -> bool:
    """Best-effort HEAD check — a source-dataset image URL from a multi-year-old
    scrape that no longer resolves would otherwise trade one broken-image class
    (missing photo) for another (dead link), which is strictly worse."""
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
    try:
        with urllib.request.urlopen(request, timeout=_REQUEST_TIMEOUT_SECONDS) as response:
            return bool(response.status == 200)
    except (URLError, OSError, ValueError):
        return False


async def run(db: AsyncSession) -> None:
    csv_path = download_dataset()
    index = build_image_index(csv_path)

    result = await db.execute(
        select(Product.product_id, Product.brand_name, Product.product_name).where(
            Product.image_url.is_(None)
        )
    )
    candidates = [(pid, brand or "", name or "") for pid, brand, name in result.all()]

    matches = find_image_matches(candidates, index)
    verified = [(pid, url) for pid, url in matches if verify_url_live(url)]

    for product_id, image_url in verified:
        product = await db.get(Product, product_id)
        assert product is not None
        product.image_url = image_url
        await append_outbox(db, "product", str(product_id), "upsert")

    await db.commit()
    print(
        f"Matched {len(matches)} product(s) against {_DATASET_SLUG} by exact "
        f"brand+name, {len(verified)} had a live image URL and were updated "
        f"({len(matches) - len(verified)} matched but the image link was dead)."
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
