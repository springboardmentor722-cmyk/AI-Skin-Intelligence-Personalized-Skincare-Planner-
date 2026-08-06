import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Ingredient

# Create database session
db: Session = SessionLocal()

# Read CSV
csv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "datasets",
    "ingredients-short-kaggle.csv"
)

df = pd.read_csv(csv_path)

count = 0

for _, row in df.iterrows():

    # Check if ingredient already exists
    existing = db.query(Ingredient).filter(
        Ingredient.ingredient_name == row["name"]
    ).first()

    if existing:
        continue

    ingredient = Ingredient(
        ingredient_name=row["name"],
        substance_id=str(row["substanceId"]) if pd.notna(row["substanceId"]) else None,
        cas_no=str(row["casNo"]) if pd.notna(row["casNo"]) else None,
        ec_no=str(row["ecNo"]) if pd.notna(row["ecNo"]) else None,
        pubchem_cid=str(row["pubchem_cid"]) if pd.notna(row["pubchem_cid"]) else None,
        pubchem_url=str(row["pubchem"]) if pd.notna(row["pubchem"]) else None,
    )

    db.add(ingredient)
    count += 1

db.commit()
db.close()

print(f"✅ {count} ingredients imported successfully!")