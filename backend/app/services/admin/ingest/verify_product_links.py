"""Checks every distinct non-null products.image_url/product_url currently in
Postgres - not raw CSVs, so overlapping URLs across the 5 ingested datasets are
each checked once. Run manually (make verify-product-links), never part of an
ingest run - network flakiness shouldn't block ingestion."""

import asyncio
import csv
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.recommendations.models import Product

_TIMEOUT_SECONDS = 10.0
_MAX_CONCURRENCY = 10
_MAX_RETRIES = 2


async def _check_one(
    client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore
) -> tuple[str, int | None]:
    async with semaphore:
        for attempt in range(_MAX_RETRIES + 1):
            try:
                response = await client.head(url, timeout=_TIMEOUT_SECONDS, follow_redirects=True)
                return url, response.status_code
            except httpx.HTTPError:
                if attempt == _MAX_RETRIES:
                    return url, None
                await asyncio.sleep(2**attempt)
        return url, None


async def check_urls(urls: list[str]) -> list[tuple[str, int | None]]:
    semaphore = asyncio.Semaphore(_MAX_CONCURRENCY)
    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*[_check_one(client, url, semaphore) for url in urls])


def classify_check_results(results: list[tuple[str, int | None]]) -> list[tuple[str, Any]]:
    broken: list[tuple[str, Any]] = []
    for url, status in results:
        if status is None:
            broken.append((url, "request failed"))
        elif status >= 400:
            broken.append((url, status))
    return broken


def _write_broken_csv(broken: list[tuple[str, Any]], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["url", "status"])
        writer.writerows(broken)
    return output_path


async def run(db: AsyncSession, processed_dir: Path) -> None:
    image_urls_result = (
        await db.execute(
            select(Product.image_url)
            .where(Product.image_url.is_not(None))
            .distinct()
        )
    ).scalars().all()
    image_urls: list[str] = [url for url in image_urls_result if url is not None]

    product_urls_result = (
        await db.execute(
            select(Product.product_url)
            .where(Product.product_url.is_not(None))
            .distinct()
        )
    ).scalars().all()
    product_urls: list[str] = [url for url in product_urls_result if url is not None]

    image_results = await check_urls(image_urls)
    url_results = await check_urls(product_urls)

    broken_images = classify_check_results(image_results)
    broken_urls = classify_check_results(url_results)

    images_path = _write_broken_csv(broken_images, processed_dir / "broken_images.csv")
    urls_path = _write_broken_csv(broken_urls, processed_dir / "broken_urls.csv")

    print(
        f"Checked {len(image_urls)} image URL(s), {len(broken_images)} broken -> {images_path}. "
        f"Checked {len(product_urls)} product URL(s), {len(broken_urls)} broken -> {urls_path}."
    )


async def main() -> None:
    from app.db.postgres import async_session_factory

    repo_root = Path(__file__).resolve().parents[5]
    processed_dir = repo_root / "training_dataset" / "processed"

    async with async_session_factory() as db:
        await run(db, processed_dir)


if __name__ == "__main__":
    asyncio.run(main())
