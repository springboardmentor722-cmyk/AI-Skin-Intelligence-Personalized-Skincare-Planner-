"""backend/app/services/admin/ingest/ingest_sephora_images_catalog.py's pure
transforms — the parts that don't need a live download or a DB."""

import csv

from app.services.admin.ingest.ingest_sephora_images_catalog import normalize_rows


def test_normalize_rows_skips_rows_with_no_brand_name_or_images(tmp_path) -> None:
    csv_path = tmp_path / "sephora.csv"
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        fieldnames = ["brand", "product_name", "price", "reviews_count", "images", "ingrediat_desc"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerow(
            {
                "brand": "CLINIQUE",
                "product_name": "Moisture Surge",
                "price": "$43.00",
                "reviews_count": "120",
                "images": (
                    "https://www.sephora.comhttps://www.sephora.com/productimages/sku/s1.jpg"
                    " ~ https://www.sephora.comhttps://www.sephora.com/productimages/product/p1.jpg"
                ),
                "ingrediat_desc": "Water, Glycerin, Water",
            }
        )
        writer.writerow(
            {
                "brand": "",
                "product_name": "No Brand Product",
                "price": "$10.00",
                "reviews_count": "5",
                "images": "https://www.sephora.comhttps://www.sephora.com/productimages/sku/s2.jpg",
                "ingrediat_desc": "Water",
            }
        )
        writer.writerow(
            {
                "brand": "Fresh",
                "product_name": "No Image Product",
                "price": "$20.00",
                "reviews_count": "3",
                "images": "",
                "ingrediat_desc": "Water",
            }
        )

    products = normalize_rows(csv_path)

    assert len(products) == 1
    entry = products[0]
    assert entry["brand_name"] == "CLINIQUE"
    assert entry["product_name"] == "Moisture Surge"
    assert entry["price"] == 43.0
    assert entry["review_count"] == 120
    assert entry["images"] == [
        "https://www.sephora.com/productimages/sku/s1.jpg",
        "https://www.sephora.com/productimages/product/p1.jpg",
    ]
    assert entry["ingredients"] == ["Water", "Glycerin"]
