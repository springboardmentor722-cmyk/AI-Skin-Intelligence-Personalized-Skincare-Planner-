# Master Product Schema

The one real target shape every dataset in `training_dataset/raw/` maps onto is the `products`/`ingredients`/`product_ingredients` Postgres tables (`database_schemas/skinlytics_postgresql_schema_v3.sql`, `backend/app/services/recommendations/models.py`'s `Product` model, `backend/app/services/ingredients/models.py`'s `Ingredient` model). This document is not a new schema — it's each dataset's real `column_mapping.json`, gathered in one place.

## ecommerce

```json
{
  "product_name": "product_name",
  "brand": "brand_name",
  "subcategory": "category (via _SUBCATEGORY_MAP, only within category=='skincare')",
  "title-href": "product_url",
  "price": "price, currency hardcoded 'INR'",
  "ingredients": "ingredients (comma-split, 150-char cap)",
  "size": "volume_ml (bare-digit strings only)",
  "rating": "rating",
  "noofratings": "review_count",
  "_filter": "category == 'skincare' only; other rows rejected as 'not a skincare product'",
  "_unmapped_target_fields": [
    "image_url",
    "skin_type_names",
    "concern_names"
  ],
  "_unused_source_columns": [
    "website",
    "country",
    "form",
    "type",
    "color"
  ]
}
```

## skincare-clean

```json
{
  "product_name": "product_name (also source of brand_name via leading-word extraction)",
  "product_url": "product_url",
  "product_type": "category (via _PRODUCT_TYPE_MAP)",
  "clean_ingreds": "ingredients (python-list-literal parse, title-cased)",
  "price": "price (\u00a3 stripped), currency hardcoded 'GBP'",
  "_unmapped_target_fields": [
    "image_url",
    "volume_ml",
    "rating",
    "review_count",
    "skin_type_names",
    "concern_names"
  ]
}
```

## skincare-ingredients

```json
{
  "brand_name": "brand_name",
  "cosmetic_name": "product_name",
  "cosmetic_link": "product_url",
  "price": "price (low end of range if a range), currency hardcoded 'USD'",
  "Skin Type": "skin_type_names (matched against known seeded skin-type names)",
  "_deliberately_unparsed": {
    "ingredients": "marketing prose, not a clean INCI list - no reliable split point, left [] rather than guessed"
  },
  "category": "always 'uncategorized' - no category/product-type column exists in this source",
  "_unmapped_target_fields": [
    "image_url",
    "volume_ml",
    "rating",
    "review_count",
    "concern_names"
  ],
  "_unused_source_columns": [
    "num_customer",
    "reviews",
    "recommended",
    "What it is",
    "Skincare Concerns",
    "Formulation",
    "Benefits",
    "Highlighted Ingredients",
    "Ingredient Callouts",
    "What Else You Need to Know",
    "Clinical Results",
    "clean_ingredients",
    "new_ingredients"
  ]
}
```
