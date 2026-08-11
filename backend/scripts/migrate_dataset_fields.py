"""Add dataset-supported columns to the existing MySQL tables.

Run once from the backend directory before starting the API after Phase 2:
    python -m scripts.migrate_dataset_fields

This migration changes table structure only. It does not import CSV records.
"""

from sqlalchemy import inspect, text

from app.database.database import engine


COLUMN_DEFINITIONS = {
    "products": {
        "currency": "VARCHAR(3) NOT NULL DEFAULT 'GBP'",
        "product_url": "VARCHAR(500) NULL",
        "image_url": "VARCHAR(500) NULL",
    },
    "ingredients": {
        "short_description": "TEXT NULL",
        "description": "TEXT NULL",
        "suitable_for": "TEXT NULL",
        "source_url": "VARCHAR(500) NULL",
    },
}


def migrate() -> None:
    inspector = inspect(engine)

    with engine.begin() as connection:
        for table_name, columns in COLUMN_DEFINITIONS.items():
            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }

            for column_name, definition in columns.items():
                if column_name in existing_columns:
                    print(f"{table_name}.{column_name} already exists; skipped.")
                    continue

                connection.execute(
                    text(
                        f"ALTER TABLE `{table_name}` "
                        f"ADD COLUMN `{column_name}` {definition}"
                    )
                )
                print(f"Added {table_name}.{column_name}.")


if __name__ == "__main__":
    migrate()
