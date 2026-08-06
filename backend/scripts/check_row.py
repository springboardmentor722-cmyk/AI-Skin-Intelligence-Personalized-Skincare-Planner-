import os
import pandas as pd

csv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "datasets",
    "product_info.csv"
)

df = pd.read_csv(csv_path)

row = df[df["product_id"] == "P471525"].iloc[0]

for col in row.index:
    print(f"{col}: {row[col]} ({type(row[col])})")