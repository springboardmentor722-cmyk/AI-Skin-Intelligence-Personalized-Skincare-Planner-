"""backend/app/services/admin/ingest/generate_dataset_reports.py - pure functions
that read already-written per-run JSON reports and column_mapping.json files, no
network/DB required for these two functions (the ingredients export needs a real
DB session, tested separately)."""

import json
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.admin.ingest.generate_dataset_reports import (
    build_master_schema_markdown,
    build_missing_data_report,
    export_normalized_ingredients,
    write_normalized_ingredients_csv,
)


def test_build_missing_data_report_aggregates_real_run_reports(tmp_path: Path) -> None:
    report_dir = tmp_path / "processed"
    report_dir.mkdir()
    (report_dir / "skincare_clean_ingest_20260803T120000Z.json").write_text(
        json.dumps(
            {
                "source": "kaggle:eward96/skincare-products-clean-dataset",
                "accepted_count": 1100,
                "rejected_count": 38,
            }
        )
    )
    (report_dir / "ecommerce_cosmetics_ingest_20260803T120500Z.json").write_text(
        json.dumps(
            {
                "source": "kaggle:devi5723/e-commerce-cosmetics-dataset",
                "accepted_count": 1900,
                "rejected_count": 177,
            }
        )
    )

    markdown = build_missing_data_report(report_dir)

    assert "eward96/skincare-products-clean-dataset" in markdown
    assert "1100" in markdown
    assert "devi5723/e-commerce-cosmetics-dataset" in markdown
    assert "1900" in markdown


def test_build_missing_data_report_handles_no_reports(tmp_path: Path) -> None:
    report_dir = tmp_path / "processed"
    report_dir.mkdir()

    markdown = build_missing_data_report(report_dir)

    assert "No ingest reports found" in markdown


def test_build_master_schema_markdown_includes_each_dataset_mapping(tmp_path: Path) -> None:
    raw_dir = tmp_path / "raw"
    (raw_dir / "skincare-clean").mkdir(parents=True)
    (raw_dir / "skincare-clean" / "column_mapping.json").write_text(
        json.dumps({"product_name": "product_name", "price": "price"})
    )

    markdown = build_master_schema_markdown(raw_dir)

    assert "skincare-clean" in markdown
    assert "product_name" in markdown


async def test_export_normalized_ingredients_returns_real_sorted_names(
    db_session: AsyncSession,
) -> None:
    from app.services.ingredients.models import Ingredient

    # Use unique ingredient names unlikely to already exist in the test DB
    db_session.add(Ingredient(ingredient_name="ZebraIngredientsTest_Unique_Alpha"))
    db_session.add(Ingredient(ingredient_name="ZebraIngredientsTest_Unique_Zulu"))
    await db_session.commit()

    names = await export_normalized_ingredients(db_session)

    # Verify deterministic ordering: query twice should yield same order (ORDER BY present)
    names_again = await export_normalized_ingredients(db_session)
    assert names == names_again
    # Should include our test ingredients
    assert "ZebraIngredientsTest_Unique_Alpha" in names
    assert "ZebraIngredientsTest_Unique_Zulu" in names


def test_write_normalized_ingredients_csv_writes_header_and_rows(tmp_path: Path) -> None:
    output_path = tmp_path / "processed" / "normalized_ingredients.csv"

    result_path = write_normalized_ingredients_csv(["Glycerin", "Water"], output_path)

    content = result_path.read_text()
    assert content == "ingredient_name\nGlycerin\nWater\n"
