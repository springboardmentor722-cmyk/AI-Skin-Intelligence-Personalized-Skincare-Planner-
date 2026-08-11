"""Import ingredient CSV records. Run: .\\venv\\Scripts\\python.exe -m scripts.import_ingredients"""
import csv
from pathlib import Path

from app.database.database import SessionLocal
from app.models.ingredient import Ingredient

CSV_PATH = Path(__file__).resolve().parents[1] / "datasets" / "ingredientsList.csv"

def import_ingredients():
    added = skipped = 0
    database = SessionLocal()
    try:
        existing_names = {name for (name,) in database.query(Ingredient.ingredient_name).all()}
        with CSV_PATH.open(encoding="utf-8-sig", newline="") as source:
            for row in csv.DictReader(source):
                name = (row.get("name") or "").strip()
                if not name or name in existing_names:
                    skipped += 1
                    continue
                database.add(Ingredient(ingredient_name=name, short_description=(row.get("short_description") or "").strip() or None, description=(row.get("what_is_it") or "").strip() or None, benefits=(row.get("what_does_it_do") or "").strip() or None, suitable_skin=None, suitable_for=(row.get("who_is_it_good_for") or "").strip() or None, side_effects=(row.get("who_should_avoid") or "").strip() or None, source_url=(row.get("url") or "").strip() or None))
                existing_names.add(name)
                added += 1
        database.commit()
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()
    print(f"Ingredients added: {added}; skipped: {skipped}")

if __name__ == "__main__":
    import_ingredients()
