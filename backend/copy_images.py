import os
import shutil
import glob

# Source directory where images are generated
src_dir = r"C:\Users\HP\.gemini\antigravity\brain\665da60d-0e8d-4fc9-bc63-225bd3916c43"
# Destination directory in the React app public folder
dest_dir = r"D:\skin-intelligence-app\frontend\public"

os.makedirs(dest_dir, exist_ok=True)

# Find and copy welcome hero
hero_files = glob.glob(os.path.join(src_dir, "skincare_welcome_hero_*.jpg"))
if hero_files:
    shutil.copy(hero_files[0], os.path.join(dest_dir, "hero.jpg"))
    print("Copied hero.jpg")

# Find and copy before
before_files = glob.glob(os.path.join(src_dir, "skin_before_*.jpg"))
if before_files:
    shutil.copy(before_files[0], os.path.join(dest_dir, "before.jpg"))
    print("Copied before.jpg")

# Find and copy after
after_files = glob.glob(os.path.join(src_dir, "skin_after_*.jpg"))
if after_files:
    shutil.copy(after_files[0], os.path.join(dest_dir, "after.jpg"))
    print("Copied after.jpg")

# Find and copy products
products_files = glob.glob(os.path.join(src_dir, "skincare_products_*.jpg"))
if products_files:
    shutil.copy(products_files[0], os.path.join(dest_dir, "products.jpg"))
    print("Copied products.jpg")
