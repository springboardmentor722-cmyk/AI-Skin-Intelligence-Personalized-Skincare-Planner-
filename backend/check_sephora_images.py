# backend/check_sephora_images.py

import csv
from pathlib import Path

csv_path = Path(__file__).parent / "data" / "product_info.csv"

print("=" * 70)
print("📂 CHECKING SEPHORA DATASET FOR IMAGES")
print("=" * 70)

if not csv_path.exists():
    print(f"❌ File not found: {csv_path}")
    print("   Please make sure product_info.csv is in backend/data/")
    exit()

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    columns = reader.fieldnames
    
    print(f"\n📋 All columns:")
    for i, col in enumerate(columns, 1):
        print(f"   {i}. {col}")
    
    print("\n🔍 Looking for image-related columns...")
    image_columns = [col for col in columns if 'image' in col.lower() or 'img' in col.lower() or 'photo' in col.lower()]
    
    if image_columns:
        print(f"\n✅ Found image columns: {image_columns}")
    else:
        print("\n❌ No image columns found in this dataset!")
        print("   The Sephora dataset might use 'product_id' to build image URLs.")
    
    # Show first 3 rows
    print("\n📋 Sample data (first 3 rows):")
    rows = []
    for i, row in enumerate(reader):
        if i >= 3:
            break
        rows.append(row)
    
    for i, row in enumerate(rows, 1):
        print(f"\nRow {i}:")
        for col in columns[:15]:  # Show first 15 columns
            val = row.get(col, '')
            if val and len(str(val)) > 80:
                val = str(val)[:80] + "..."
            print(f"   {col}: {val}")