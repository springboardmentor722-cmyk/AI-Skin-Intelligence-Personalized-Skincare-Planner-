"""
Shared feature engineering for the ML layer. Both training (train_models.py)
and inference (predict.py) import from here so the feature columns a model
was trained on always match the columns built at prediction time.
"""
from typing import List
import numpy as np
import pandas as pd

ALL_CONCERNS = [
    "acne", "hyperpigmentation", "dark_spots", "dry_skin", "oily_skin",
    "sensitive_skin", "wrinkles", "fine_lines", "redness", "uneven_skin_tone",
]
ALL_SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"]
ALL_HABITS = ["smoking", "high_stress", "poor_diet", "excessive_sun_exposure", "low_water_intake"]
ALL_ENV = ["high_pollution", "high_uv", "dry_climate", "high_humidity"]
ALL_PRODUCT_CATEGORIES = [
    "Face Wash", "Moisturizer", "Sunscreen", "Serum", "Toner", "Treatment Products", "Face Masks",
]
AGE_ORDER = {"teen": 0, "20s": 1, "30s": 2, "40s": 3, "50+": 4}
SLEEP_ORDER = {"poor": 0, "average": 1, "good": 2, "excellent": 3}


def _one_hot(value: str, categories: List[str], prefix: str) -> dict:
    return {f"{prefix}_{c}": int(value == c) for c in categories}


def _multi_hot(values: List[str], categories: List[str], prefix: str) -> dict:
    values = values or []
    return {f"{prefix}_{c}": int(c in values) for c in categories}


def profile_base_features(profile_dict: dict) -> dict:
    """Features describing the user's profile only (no target concern/product yet)."""
    feats = {}
    feats.update(_one_hot(profile_dict.get("skin_type", "normal"), ALL_SKIN_TYPES, "skin"))
    feats["age_index"] = AGE_ORDER.get(profile_dict.get("age_group", "20s"), 1)
    feats["sleep_index"] = SLEEP_ORDER.get(profile_dict.get("sleep_quality", "average"), 1)
    feats["sleep_hours"] = float(profile_dict.get("sleep_hours", 7.0))
    feats["water_intake_liters"] = float(profile_dict.get("water_intake_liters", 2.0))
    feats.update(_multi_hot(profile_dict.get("lifestyle_habits", []), ALL_HABITS, "habit"))
    feats.update(_multi_hot(profile_dict.get("environmental_exposure", []), ALL_ENV, "env"))
    return feats


def concern_severity_features(profile_dict: dict, concern: str) -> dict:
    feats = profile_base_features(profile_dict)
    feats.update(_one_hot(concern, ALL_CONCERNS, "target_concern"))
    return feats


def product_suitability_features(profile_dict: dict, product_dict: dict) -> dict:
    feats = profile_base_features(profile_dict)
    feats.update(_multi_hot(profile_dict.get("skin_concerns", []), ALL_CONCERNS, "user_concern"))
    feats.update(_one_hot(product_dict.get("category", ""), ALL_PRODUCT_CATEGORIES, "cat"))
    feats["price"] = float(product_dict.get("price", 0.0))
    feats["skin_type_match"] = int(profile_dict.get("skin_type") in (product_dict.get("suitable_skin_types") or []))
    user_concerns = set(profile_dict.get("skin_concerns") or [])
    product_concerns = set(product_dict.get("suitable_concerns") or [])
    feats["concern_overlap_count"] = len(user_concerns & product_concerns)
    allergies = set(a.lower() for a in (profile_dict.get("allergies") or []))
    ingredients = set(i.lower() for i in (product_dict.get("key_ingredients") or []))
    feats["allergy_conflict"] = int(len(allergies & ingredients) > 0)
    budget_ceiling = {"low": 800, "medium": 2000, "high": 999999}.get(profile_dict.get("budget_range", "medium"), 2000)
    feats["over_budget"] = int(feats["price"] > budget_ceiling)
    return feats


def to_dataframe(rows: List[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows).fillna(0)
