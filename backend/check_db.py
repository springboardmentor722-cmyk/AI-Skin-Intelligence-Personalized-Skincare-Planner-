# backend/check_db.py

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product, ProductRecommendation

db = SessionLocal()

print("=" * 60)
print("📊 DATABASE CHECK")
print("=" * 60)

# Count products
products = db.query(Product).all()
print(f"\nTotal products: {len(products)}")

# Check for duplicates
names = {}
for p in products:
    if p.name in names:
        names[p.name].append(p.id)
    else:
        names[p.name] = [p.id]

duplicates = {name: ids for name, ids in names.items() if len(ids) > 1}
if duplicates:
    print(f"\n⚠️ DUPLICATES FOUND:")
    for name, ids in duplicates.items():
        print(f"   {name}: {len(ids)} copies (IDs: {ids})")
else:
    print("\n✅ No duplicates found!")

# Count recommendations
recs = db.query(ProductRecommendation).count()
print(f"\nTotal recommendations: {recs}")

db.close()