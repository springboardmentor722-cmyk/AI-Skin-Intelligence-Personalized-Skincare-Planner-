"""Aggregates the per-run JSON reports every ingest module already writes
(app.services.admin.ingest._shared.write_ingest_report) into one real missing-data
summary, and each dataset's column_mapping.json into one master-schema doc. Reads
existing artifacts only - never recomputes accepted/rejected counts itself, so the
numbers always match what a real ingest run actually printed."""

import csv
import json
import re
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ingredients.models import Ingredient

# report_name values every ingest module's write_ingest_report() call uses
# (see grep of "report_name=" across this package) - kept here only to footnote
# a dataset with no manifest on disk at all, not to validate anything else.
_KNOWN_REPORT_PREFIXES = (
    "products",
    "skincare_clean",
    "ecommerce_cosmetics",
    "skincare_ingredients",
)

_REPORT_FILENAME_RE = re.compile(r"^(.+)_ingest_\d{8}T\d{6}Z$")


def build_missing_data_report(report_dir: Path) -> str:
    # Re-running an ingest module leaves multiple timestamped manifests behind for
    # the same dataset (fix-round re-runs, etc.) - keep only the newest per dataset,
    # or Accepted/Rejected totals double- or quadruple-count. glob() sorted
    # lexicographically also sorts each dataset's own timestamps chronologically,
    # so a later dict write below always overwrites an earlier manifest for the
    # same prefix.
    reports_by_prefix: dict[str, dict[str, Any]] = {}
    for path in sorted(report_dir.glob("*_ingest_*.json")):
        match = _REPORT_FILENAME_RE.match(path.stem)
        prefix = match.group(1) if match else path.stem
        reports_by_prefix[prefix] = json.loads(path.read_text(encoding="utf-8"))

    if not reports_by_prefix:
        return "# Missing Data Report\n\nNo ingest reports found in this directory yet.\n"

    lines = [
        "# Missing Data Report",
        "",
        "Aggregated from real per-run ingest reports in `training_dataset/processed/`"
        " — every number here is copied from an actual completed run, never recomputed."
        " Only the newest manifest per dataset is counted.",
        "",
        "| Source | Accepted | Rejected | Ingested At |",
        "|---|---|---|---|",
    ]
    for report in reports_by_prefix.values():
        lines.append(
            f"| {report['source']} | {report['accepted_count']} | "
            f"{report['rejected_count']} | {report.get('ingested_at', '?')} |"
        )

    missing = [prefix for prefix in _KNOWN_REPORT_PREFIXES if prefix not in reports_by_prefix]
    if missing:
        lines.append("")
        lines.append(
            f"**No manifest on disk for:** {', '.join(missing)} — these dataset(s) have"
            " no `*_ingest_*.json` report in `training_dataset/processed/`, so they're"
            " omitted above rather than silently shown as zero."
        )
    return "\n".join(lines) + "\n"


def build_master_schema_markdown(raw_dir: Path) -> str:
    lines = [
        "# Master Product Schema",
        "",
        "The one real target shape every dataset in `training_dataset/raw/` maps onto"
        " is the `products`/`ingredients`/`product_ingredients` Postgres tables"
        " (`database_schemas/skinlytics_postgresql_schema_v3.sql`,"
        " `backend/app/services/recommendations/models.py`'s `Product` model,"
        " `backend/app/services/ingredients/models.py`'s `Ingredient` model)."
        " This document is not a new schema — it's each dataset's real"
        " `column_mapping.json`, gathered in one place.",
        "",
    ]
    for mapping_path in sorted(raw_dir.glob("*/column_mapping.json")):
        dataset_slug = mapping_path.parent.name
        mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
        lines.append(f"## {dataset_slug}")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(mapping, indent=2))
        lines.append("```")
        lines.append("")
    return "\n".join(lines)


async def export_normalized_ingredients(db: AsyncSession) -> list[str]:
    """Plain export of the already-normalized (on ingest) ingredients table - not
    a new normalization pass."""
    query = select(Ingredient.ingredient_name).order_by(Ingredient.ingredient_name)
    result = await db.execute(query)
    return list(result.scalars().all())


def write_normalized_ingredients_csv(ingredient_names: list[str], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Real ingredient names contain commas (legit INCI names like "1,2-Hexanediol"),
    # embedded newlines, and double quotes - hand-rolled "\n".join() corrupts all
    # three. csv.writer quotes/escapes correctly (same pattern as verify_product_links.py).
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ingredient_name"])
        writer.writerows([name] for name in ingredient_names)
    return output_path


async def main() -> None:
    from app.db.postgres import async_session_factory

    repo_root = Path(__file__).resolve().parents[5]
    raw_dir = repo_root / "training_dataset" / "raw"
    processed_dir = repo_root / "training_dataset" / "processed"

    missing_data_md = build_missing_data_report(processed_dir)
    (processed_dir / "missing_data_report.md").write_text(missing_data_md, encoding="utf-8")

    master_schema_md = build_master_schema_markdown(raw_dir)
    (repo_root / "training_dataset" / "master_product_schema.md").write_text(
        master_schema_md, encoding="utf-8"
    )

    async with async_session_factory() as db:
        ingredient_names = await export_normalized_ingredients(db)
    csv_output = processed_dir / "normalized_ingredients.csv"
    csv_path = write_normalized_ingredients_csv(ingredient_names, csv_output)

    print(
        f"Wrote {processed_dir / 'missing_data_report.md'}, "
        f"{repo_root / 'training_dataset' / 'master_product_schema.md'}, "
        f"{csv_path} ({len(ingredient_names)} ingredients)."
    )


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
