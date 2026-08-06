import os
import pandas as pd

csv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "datasets",
    "product_info.csv"
)

df = pd.read_csv(csv_path)

LIMIT = 2147483647

print("Checking numeric columns...\n")

for col in df.columns:
    if pd.api.types.is_numeric_dtype(df[col]):
        max_value = df[col].max(skipna=True)

        if pd.notna(max_value):
            print(f"{col}: {max_value}")

            if max_value > LIMIT:
                print("❌ OUT OF RANGE")