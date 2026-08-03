"""backend/app/services/admin/ingest/enrich_product_images.py's pure transforms —
normalize(), clean_image_url(), build_image_index(), find_image_matches(), and the
Dermstore/Open Beauty Facts loaders added in ADR-044 — the parts of this pipeline
that don't need a live Kaggle download, a network call, or a DB."""

import csv
import json

from app.services.admin.ingest.enrich_product_images import (
    build_image_index,
    build_image_index_dermstore,
    build_image_index_open_beauty_facts,
    clean_dermstore_image_url,
    clean_image_url,
    find_image_matches,
    normalize,
)


def test_normalize_matches_despite_case_and_punctuation_noise() -> None:
    assert normalize("CLINIQUE") == normalize("Clinique")
    assert normalize("All About Eyes®") == normalize("All about eyes")
    assert normalize("  Extra   Spaces  ") == "extra spaces"


def test_normalize_does_not_conflate_different_products() -> None:
    assert normalize("Clarifying Lotion 2") != normalize("Clarifying Lotion 3")


def test_clean_image_url_repairs_the_known_duplicated_domain_bug() -> None:
    raw = "https://www.sephora.comhttps://www.sephora.com/productimages/sku/s1-main-zoom.jpg"
    assert clean_image_url(raw) == "https://www.sephora.com/productimages/sku/s1-main-zoom.jpg"


def test_clean_image_url_takes_the_first_of_multiple_tilde_joined_urls() -> None:
    raw = (
        "https://www.sephora.comhttps://www.sephora.com/productimages/sku/s1.jpg"
        " ~ https://www.sephora.comhttps://www.sephora.com/productimages/sku/s2.jpg"
    )
    assert clean_image_url(raw) == "https://www.sephora.com/productimages/sku/s1.jpg"


def test_clean_image_url_returns_none_for_empty_cell() -> None:
    assert clean_image_url("") is None


def test_build_image_index_keys_by_normalized_brand_and_name(tmp_path) -> None:
    csv_path = tmp_path / "sephora.csv"
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["brand", "product_name", "images"])
        writer.writeheader()
        writer.writerow(
            {
                "brand": "CLINIQUE",
                "product_name": "Clarifying Lotion 2",
                "images": "https://www.sephora.comhttps://www.sephora.com/productimages/sku/s1.jpg",
            }
        )
        # No image at all — must be skipped, not indexed with a None value.
        writer.writerow({"brand": "Fresh", "product_name": "Rose Face Mask", "images": ""})

    index = build_image_index(csv_path)

    assert index[(normalize("CLINIQUE"), normalize("Clarifying Lotion 2"))] == (
        "https://www.sephora.com/productimages/sku/s1.jpg"
    )
    assert (normalize("Fresh"), normalize("Rose Face Mask")) not in index


def test_clean_dermstore_image_url_takes_the_first_of_multiple_comma_joined_urls() -> None:
    raw = "https://static.thcdn.com/productimg/original/a.jpg, https://static.thcdn.com/productimg/original/b.jpg"
    assert clean_dermstore_image_url(raw) == "https://static.thcdn.com/productimg/original/a.jpg"


def test_clean_dermstore_image_url_returns_none_for_empty_cell() -> None:
    assert clean_dermstore_image_url("") is None


def test_build_image_index_dermstore_keys_by_normalized_brand_and_title(tmp_path) -> None:
    json_path = tmp_path / "dermstore_data.json"
    json_path.write_text(
        json.dumps(
            [
                {
                    "brand": "Neostrata",
                    "title": "Exclusive NEOSTRATA Anti-Aging Firming Duo",
                    "images": "https://static.thcdn.com/productimg/original/a.jpg, https://static.thcdn.com/productimg/original/b.jpg",
                },
                # No images at all — must be skipped, not indexed with a None value.
                {"brand": "Fresh", "title": "Rose Face Mask", "images": ""},
            ]
        ),
        encoding="utf-8",
    )

    index = build_image_index_dermstore(json_path)

    assert index[
        (normalize("Neostrata"), normalize("Exclusive NEOSTRATA Anti-Aging Firming Duo"))
    ] == "https://static.thcdn.com/productimg/original/a.jpg"
    assert (normalize("Fresh"), normalize("Rose Face Mask")) not in index


def test_build_image_index_open_beauty_facts_keys_by_normalized_brand_and_name(
    tmp_path,
) -> None:
    tsv_path = tmp_path / "en.openbeautyfacts.org.products.tsv"
    with open(tsv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=["brands", "product_name", "image_url"], delimiter="\t"
        )
        writer.writeheader()
        writer.writerow(
            {
                "brands": "Purell",
                "product_name": "Advanced Gel hydro-alcoolique pour les mains",
                "image_url": "http://en.openbeautyfacts.org/images/products/007/front.6.400.jpg",
            }
        )
        # Co-branded row — normalizes to a string no single real brand equals,
        # so it must never match anything (same exact-match discipline).
        writer.writerow(
            {
                "brands": "Revlon,Colorsilk",
                "product_name": "Colorsilk Beautiful Color",
                "image_url": "http://en.openbeautyfacts.org/images/products/030/front.1.400.jpg",
            }
        )
        # No image at all — must be skipped, not indexed with a None value.
        writer.writerow({"brands": "Haka", "product_name": "Euterpflege Spezial", "image_url": ""})

    index = build_image_index_open_beauty_facts(tsv_path)

    assert index[
        (normalize("Purell"), normalize("Advanced Gel hydro-alcoolique pour les mains"))
    ] == "http://en.openbeautyfacts.org/images/products/007/front.6.400.jpg"
    assert (normalize("Revlon"), normalize("Colorsilk Beautiful Color")) not in index
    assert (normalize("Haka"), normalize("Euterpflege Spezial")) not in index


def test_find_image_matches_only_matches_exact_normalized_brand_and_name() -> None:
    index = {
        (normalize("CLINIQUE"), normalize("Clarifying Lotion 2")): "https://example.com/a.jpg",
    }
    products = [
        (1, "Clinique", "Clarifying Lotion 2"),  # matches despite case difference
        (2, "Clinique", "Clarifying Lotion 3"),  # different product, must not match
        (3, "Unrelated Brand", "Clarifying Lotion 2"),  # different brand, must not match
    ]

    matches = find_image_matches(products, index)

    assert matches == [(1, "https://example.com/a.jpg")]
