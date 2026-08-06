import os
import pandas as pd
import requests

# CSV Path
csv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "datasets",
    "indian_products.csv"   # <-- change if your csv has another name
)

# Folder where React will read images
image_folder = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "frontend",
    "public",
    "products"
)

os.makedirs(image_folder, exist_ok=True)

df = pd.read_csv(csv_path)

headers = {
    "User-Agent": "Mozilla/5.0"
}

for _, row in df.iterrows():

    url = row["product_url"]
    filename = row["image_name"]

    print("Searching:", row["product_name"])

    try:
        html = requests.get(url, headers=headers, timeout=20).text

        start = html.find('property="og:image"')

        if start == -1:
            print("No image found")
            continue

        content = html.find('content="', start)

        end = html.find('"', content + 9)

        image_url = html[content + 9:end]

        image = requests.get(image_url, headers=headers)

        with open(os.path.join(image_folder, filename), "wb") as f:
            f.write(image.content)

        print("Downloaded:", filename)

    except Exception as e:
        print(e)

print("Finished")