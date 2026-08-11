"""Import product CSV records. Run: .\\venv\\Scripts\\python.exe -m scripts.import_products"""
import csv
from decimal import Decimal
from pathlib import Path

from app.database.database import SessionLocal
from app.models.product import Product

CSV_PATH = Path(__file__).resolve().parents[1] / "datasets" / "skincare_products_clean.csv"

def import_products():
    added = skipped = 0
    database = SessionLocal()
    try:
        existing_names = {name for (name,) in database.query(Product.product_name).all()}
        with CSV_PATH.open(encoding="utf-8-sig", newline="") as source:
            for row in csv.DictReader(source):
                name = (row.get("product_name") or "").strip()
                if not name or name in existing_names:
                    skipped += 1
                    continue
                database.add(Product(product_name=name, brand=None, category=(row.get("product_type") or "").strip() or None, ingredients=(row.get("clean_ingreds") or "").strip() or None, skin_type=None, price=Decimal((row.get("price") or "").replace("£", "").replace(",", "").strip()), currency="GBP", product_url=(row.get("product_url") or "").strip() or None, image_url=None))
                existing_names.add(name)
                added += 1
        database.commit()
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()
    print(f"Products added: {added}; skipped: {skipped}")

if __name__ == "__main__":
    import_products()
