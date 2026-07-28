"""
Robust CSV importer for Sephora skincare products.
Fixes for Neon PostgreSQL free-tier:
  - Reads ALL data into memory first (no per-row DB round-trips for ingredients)
  - Uses bulk inserts in batches of 200
  - Auto-reconnects if connection drops between batches
  - Skips already-inserted products (resume support via name+brand check)
"""

import csv
import re
import ast
import os
import uuid
import time

from app.models.assessment import SkinAssessment          # noqa
from app.models.skin_profile import SkinProfile           # noqa
from app.models.engagement import Appointment             # noqa
from app.models.ingredient import Ingredient              # noqa
from app.db.postgres import SessionLocal, engine
from app.models.product import Product, ProductCategory, ProductIngredient
from sqlalchemy import text

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "sephora_products", "product_info.csv")
BATCH_SIZE = 200

CATEGORY_MAP = {
    "Moisturizers":             "moisturizer",
    "Cleansers":                "face_wash",
    "Treatments":               "treatment",
    "Masks":                    "face_mask",
    "Sunscreen":                "sunscreen",
    "Eye Care":                 "treatment",
    "Lip Balms & Treatments":   "treatment",
    "Lip Balms \u0026 Treatments": "treatment",
}

SKIP_SECONDARY = {
    "Value & Gift Sets", "Value \u0026 Gift Sets",
    "Mini Size", "High Tech Tools",
    "Self Tanners", "Wellness", "Shop by Concern",
}

SKIN_TYPE_KEYWORDS = {
    "dry skin": "dry", "for dry": "dry",
    "oily skin": "oily", "for oily": "oily",
    "sensitive skin": "sensitive", "for sensitive": "sensitive",
    "combination skin": "combination", "for combination": "combination",
    "normal skin": "normal", "all skin types": "all",
}

CONCERN_KEYWORDS = [
    "acne", "blemish", "pore", "dark spot", "hyperpigmentation",
    "anti-aging", "aging", "wrinkle", "fine line", "firming",
    "brightening", "radiance", "dullness", "hydrat", "moisture",
    "redness", "soothing", "sun damage", "spf", "texture", "exfoliat",
]

FALLBACK_IMAGES = {
    "moisturizer": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
    "face_wash":   "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=300&q=80",
    "treatment":   "https://images.unsplash.com/photo-1608248597279-b3c6b6a7b16f?auto=format&fit=crop&w=300&q=80",
    "face_mask":   "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80",
    "sunscreen":   "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80",
    "serum":       "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=300&q=80",
    "toner":       "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=300&q=80",
}


def parse_list_field(raw):
    if not raw or raw.strip() in ("", "[]"):
        return []
    try:
        val = ast.literal_eval(raw)
        if isinstance(val, list):
            return [str(x).strip() for x in val]
    except Exception:
        pass
    return [x.strip().strip("'\"") for x in raw.strip("[]").split(",") if x.strip()]


def extract_skin_types(highlights):
    text = " ".join(highlights).lower()
    found = []
    for kw, st in SKIN_TYPE_KEYWORDS.items():
        if kw in text and st not in found:
            found.append(st)
    return ", ".join(found) if found else "all"


def extract_concerns(highlights, tertiary):
    text = (" ".join(highlights) + " " + tertiary).lower()
    found = [kw for kw in CONCERN_KEYWORDS if kw in text]
    return ", ".join(found[:6])


def parse_ingredients(raw):
    if not raw or raw.strip() in ("", "[]"):
        return []
    try:
        val = ast.literal_eval(raw)
        if isinstance(val, list) and val:
            parts = [p.strip() for p in str(val[0]).split(",") if p.strip()]
            return parts[:8]
    except Exception:
        pass
    clean = re.sub(r"[\[\]'\"]", "", raw)
    return [p.strip() for p in clean.split(",") if p.strip()][:8]


def get_db():
    for attempt in range(5):
        try:
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            return db
        except Exception as e:
            print(f"  DB connect attempt {attempt+1} failed: {e}")
            time.sleep(5)
            engine.dispose()
    raise RuntimeError("Could not connect to database after 5 attempts.")


def run():
    # ── Step 1: Read all CSV data into memory ──────────────────────────────
    print(f"Reading {CSV_PATH} ...")
    rows_data = []
    with open(CSV_PATH, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("primary_category", "").strip() != "Skincare":
                continue
            sec = row.get("secondary_category", "").strip()
            if sec in SKIP_SECONDARY:
                continue

            name  = row.get("product_name", "").strip()
            brand = row.get("brand_name",   "").strip()
            if not name or not brand:
                continue

            cat_str  = CATEGORY_MAP.get(sec, "treatment")
            try:   price  = float(row.get("price_usd") or 0)
            except: price = 0.0
            try:
                rating = round(min(max(float(row.get("rating") or 4.0), 0.0), 5.0), 1)
            except: rating = 4.0

            highlights = parse_list_field(row.get("highlights", ""))
            skin_types = extract_skin_types(highlights)
            concerns   = extract_concerns(highlights, row.get("tertiary_category", ""))
            description = "; ".join(highlights[:3]) if highlights else f"Premium {sec.lower()} by {brand}."
            ing_names  = parse_ingredients(row.get("ingredients", ""))
            image_url  = FALLBACK_IMAGES.get(cat_str, FALLBACK_IMAGES["treatment"])

            rows_data.append({
                "name": name, "brand": brand, "cat_str": cat_str,
                "price": price, "rating": rating, "skin_types": skin_types,
                "concerns": concerns, "description": description,
                "image_url": image_url, "ing_names": ing_names,
            })

    print(f"Loaded {len(rows_data)} skincare products into memory.")

    # ── Step 2: Connect & truncate ─────────────────────────────────────────
    print("Connecting to database...")
    db = get_db()
    print("Truncating products and ingredients tables...")
    db.execute(text("TRUNCATE TABLE products CASCADE"))
    db.execute(text("TRUNCATE TABLE ingredients CASCADE"))
    db.commit()
    print("Tables cleared.")

    # ── Step 3: Build ingredient master (in-memory, insert once) ──────────
    print("Collecting unique ingredients from CSV...")
    all_ing_names = set()
    for r in rows_data:
        for n in r["ing_names"]:
            clean = n.strip()[:100]
            if clean:
                all_ing_names.add(clean)

    print(f"  {len(all_ing_names)} unique ingredients found. Inserting...")
    ing_id_map = {}  # name -> uuid

    ing_objects = []
    for name in all_ing_names:
        uid = uuid.uuid4()
        ing_id_map[name] = uid
        ing_objects.append({
            "id": uid,
            "name": name,
            "benefits": "",
            "suitable_for_skin_types": "all",
            "risk_level": "low",
        })

    # Insert ingredients in batches
    for i in range(0, len(ing_objects), 500):
        batch = ing_objects[i:i+500]
        try:
            db.execute(
                Ingredient.__table__.insert(),
                batch
            )
            db.commit()
            print(f"  Ingredients: {min(i+500, len(ing_objects))}/{len(ing_objects)}")
        except Exception as e:
            print(f"  Ingredient batch error: {e}. Reconnecting...")
            db.rollback()
            db.close()
            engine.dispose()
            db = get_db()

    print("Ingredients inserted.")

    # ── Step 4: Insert products in batches ─────────────────────────────────
    print(f"Inserting {len(rows_data)} products in batches of {BATCH_SIZE}...")
    inserted = 0
    pi_buffer = []  # product-ingredient links buffer

    for batch_start in range(0, len(rows_data), BATCH_SIZE):
        batch = rows_data[batch_start : batch_start + BATCH_SIZE]
        product_rows = []
        batch_pi     = []

        for r in batch:
            uid = uuid.uuid4()
            try:
                cat_enum = ProductCategory(r["cat_str"])
            except ValueError:
                cat_enum = ProductCategory("treatment")

            product_rows.append({
                "id":                    uid,
                "name":                  r["name"],
                "brand":                 r["brand"],
                "category":              cat_enum,
                "price":                 r["price"],
                "rating":                r["rating"],
                "suitable_for_skin_types": r["skin_types"],
                "concerns":              r["concerns"],
                "image_url":             r["image_url"],
                "description":           r["description"],
                "usage_instructions":    "Apply to clean, dry skin as directed.",
            })

            for ing_name in r["ing_names"]:
                clean = ing_name.strip()[:100]
                if clean and clean in ing_id_map:
                    batch_pi.append({
                        "id":            uuid.uuid4(),
                        "product_id":    uid,
                        "ingredient_id": ing_id_map[clean],
                    })

        # Retry loop for each batch
        for attempt in range(3):
            try:
                db.execute(Product.__table__.insert(), product_rows)
                if batch_pi:
                    db.execute(ProductIngredient.__table__.insert(), batch_pi)
                db.commit()
                inserted += len(product_rows)
                print(f"  Inserted {inserted}/{len(rows_data)}")
                break
            except Exception as e:
                print(f"  Batch error (attempt {attempt+1}): {e}")
                db.rollback()
                db.close()
                engine.dispose()
                time.sleep(8)
                db = get_db()

    # ── Step 5: Verify ─────────────────────────────────────────────────────
    total = db.query(Product).count()
    print(f"\n[DONE] Inserted: {inserted} | Total in DB: {total}")
    db.close()


if __name__ == "__main__":
    run()
