# filter_and_download.py
"""
Filters thebeautyapi dataset to skincare + suncare products only,
then downloads just the matching product images.
Run: python filter_and_download.py
"""

import pandas as pd
import requests
import os

# 1. Load and filter to skincare-relevant categories only
df = pd.read_csv('beauty_data.csv')
skincare_df = df[df['category'].isin(['skincare', 'suncare'])].copy()
print(f"Filtered from {len(df)} total products to {len(skincare_df)} skincare/suncare products.")

# 2. Save the filtered CSV (this is your clean product data)
skincare_df.to_csv('skincare_products_filtered.csv', index=False)
print("Saved skincare_products_filtered.csv")

# 3. Download only the matching images
os.makedirs('skincare_images', exist_ok=True)
base_url = 'https://huggingface.co/datasets/thebeautyapi/beautyproducts/resolve/main/images/'

downloaded = 0
failed = 0

for idx, row in skincare_df.iterrows():
    image_name = row['image_name']
    if pd.isna(image_name):
        continue
    url = base_url + str(image_name)
    save_path = os.path.join('skincare_images', str(image_name))

    if os.path.exists(save_path):
        continue  # already downloaded, skip

    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(resp.content)
            downloaded += 1
        else:
            print(f"Failed ({resp.status_code}): {image_name}")
            failed += 1
    except Exception as e:
        print(f"Error downloading {image_name}: {e}")
        failed += 1

    if downloaded % 50 == 0 and downloaded > 0:
        print(f"...downloaded {downloaded} so far")

print(f"\nDone! Downloaded {downloaded} images, {failed} failed.")
print("Check the 'skincare_images' folder and 'skincare_products_filtered.csv'.")