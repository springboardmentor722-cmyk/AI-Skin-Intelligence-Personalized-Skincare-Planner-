# backend/check_products.py

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product

db = SessionLocal()
products = db.query(Product).all()

print(f"Total products: {len(products)}")
print("\nProduct list:")
for p in products:
    print(f"  {p.id}. {p.name} - {p.brand}")

db.close()