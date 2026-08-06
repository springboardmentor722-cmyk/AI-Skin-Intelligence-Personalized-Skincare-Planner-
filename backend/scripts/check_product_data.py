import os
import pandas as pd

csv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "datasets",
    "product_info.csv"
)

df = pd.read_csv(csv_path)

columns = [
    "brand_id",
    "loves_count",
    "reviews",
    "child_count"
]

for col in columns:
    print(f"{col}:")
    print("Max:", df[col].max())
    print("Min:", df[col].min())
    print("Data Type:", df[col].dtype)
    print("-" * 40)