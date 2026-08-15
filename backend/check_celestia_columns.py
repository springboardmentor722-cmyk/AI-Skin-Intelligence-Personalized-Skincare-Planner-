# backend/check_celestia_columns.py

import csv
from pathlib import Path

# The path to your Celestia CSV file
CSV_PATH = Path(__file__).parent / "data" / "CELESTIA_SKINCARE_DATASET_KAGGLE_READY.csv"

print(f"Checking file: {CSV_PATH}")
print(f"File exists: {CSV_PATH.exists()}\n")

if CSV_PATH.exists():
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        # Try to detect delimiter
        sample = f.read(1024)
        f.seek(0)
        sniffer = csv.Sniffer()
        delimiter = sniffer.sniff(sample).delimiter
        print(f"Detected delimiter: '{delimiter}'\n")
        
        reader = csv.DictReader(f, delimiter=delimiter)
        print("Column names:")
        for i, col in enumerate(reader.fieldnames, 1):
            print(f"   {i}. {col}")
        
        print("\nFirst 3 rows of data:")
        for i, row in enumerate(reader):
            if i >= 3:
                break
            print(f"\nRow {i+1}:")
            for key, value in list(row.items())[:5]:  # Show first 5 columns
                print(f"   {key}: {value[:100] if value else 'NULL'}...")