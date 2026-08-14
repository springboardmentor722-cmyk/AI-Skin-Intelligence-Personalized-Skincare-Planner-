"""
Trains the two ML models used by the platform:

1. Concern Severity Model (XGBoost regressor) - predicts how severe a given
   skin concern is (0-100) for a profile.
2. Product Suitability Model (LightGBM regressor) - predicts how suitable a
   product is (0-100) for a profile.

WHY BOOTSTRAP FROM RULES INSTEAD OF WAITING FOR REAL DATA
----------------------------------------------------------
At project start there is no historical dataset of (user profile -> actual
dermatologist-confirmed severity) or (user profile + product -> actual
satisfaction outcome). That data only exists once real users start using the
platform. Rather than shipping with no ML at all, we bootstrap labels from
the domain-expert rules already encoded in engine.py (concern_severity_score
and score_product_for_profile), add realistic noise, and train gradient-
boosted models to reproduce and generalize those rules.

This is a standard, defensible cold-start technique: "expert system first,
train a model to mimic + generalize it, then fine-tune on real outcomes once
you have them." Once you have logged real assessment outcomes and user
feedback (e.g. did the user actually buy/like the recommended product, did
their skin improve), replace the `generate_*_training_data` functions below
with a query against real ProgressLog / SkinHealthScore history instead of
synthetic sampling -- the feature engineering and model training code
doesn't need to change at all.

Run with:
    python -m app.ml.train_models
"""
import random
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import joblib
import os

from . import features as feat

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

random.seed(42)
np.random.seed(42)


class FakeProfile:
    """Lightweight stand-in for a SkinProfile SQLAlchemy row, used only for
    feeding the existing rule-based engine functions during synthetic label
    generation (so we reuse the exact same business logic, not a re-write of it)."""
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


class FakeProduct:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


def random_profile_dict() -> dict:
    skin_type = random.choice(feat.ALL_SKIN_TYPES)
    n_concerns = random.randint(1, 4)
    concerns = random.sample(feat.ALL_CONCERNS, n_concerns)
    n_habits = random.randint(0, 3)
    habits = random.sample(feat.ALL_HABITS, n_habits)
    n_env = random.randint(0, 2)
    env = random.sample(feat.ALL_ENV, n_env)
    n_allergies = random.randint(0, 1)
    allergies = random.sample(["Retinol", "Vitamin C", "Fragrance", "Niacinamide"], n_allergies)

    return {
        "skin_type": skin_type,
        "age_group": random.choice(list(feat.AGE_ORDER.keys())),
        "skin_concerns": concerns,
        "allergies": allergies,
        "sensitivities": [],
        "lifestyle_habits": habits,
        "sleep_quality": random.choice(list(feat.SLEEP_ORDER.keys())),
        "sleep_hours": round(random.uniform(4, 9), 1),
        "water_intake_liters": round(random.uniform(0.5, 3.5), 1),
        "environmental_exposure": env,
        "budget_range": random.choice(["low", "medium", "high"]),
    }


def random_product_dict() -> dict:
    category = random.choice(feat.ALL_PRODUCT_CATEGORIES)
    n_ingredients = random.randint(0, 2)
    ingredients = random.sample(["Niacinamide", "Vitamin C", "Hyaluronic Acid", "Salicylic Acid", "Retinol", "Ceramides", "Peptides"], n_ingredients)
    n_skin_types = random.randint(1, 3)
    suitable_skin_types = random.sample(feat.ALL_SKIN_TYPES, n_skin_types)
    n_concerns = random.randint(0, 3)
    suitable_concerns = random.sample(feat.ALL_CONCERNS, n_concerns)
    return {
        "category": category,
        "price": round(random.uniform(200, 1500), 0),
        "key_ingredients": ingredients,
        "suitable_skin_types": suitable_skin_types,
        "suitable_concerns": suitable_concerns,
    }


def generate_concern_severity_training_data(n_samples: int):
    """Bootstraps labels using engine.concern_severity_score (the rule engine)."""
    from .. import engine  # local import to avoid circulars at module load time

    rows, labels = [], []
    for _ in range(n_samples):
        profile_dict = random_profile_dict()
        profile_obj = FakeProfile(**profile_dict)
        concern = random.choice(feat.ALL_CONCERNS)  # train on ALL concerns, not just the ones in this profile,
        # so the model generalizes to "what if this concern were present" rather than memorizing only listed ones.
        rule_score = engine.concern_severity_score(profile_obj, concern)
        noisy_label = np.clip(rule_score + np.random.normal(0, 4), 0, 100)  # simulate real-world variance
        rows.append(feat.concern_severity_features(profile_dict, concern))
        labels.append(noisy_label)
    return feat.to_dataframe(rows), np.array(labels)


def generate_product_suitability_training_data(n_samples: int):
    """Bootstraps labels using engine.score_product_for_profile (the rule engine)."""
    from .. import engine

    rows, labels = [], []
    for _ in range(n_samples):
        profile_dict = random_profile_dict()
        product_dict = random_product_dict()
        profile_obj = FakeProfile(**profile_dict)
        product_obj = FakeProduct(**product_dict)
        result = engine.score_product_for_profile(product_obj, profile_obj)
        noisy_label = np.clip(result["score"] + np.random.normal(0, 5), 0, 100)
        rows.append(feat.product_suitability_features(profile_dict, product_dict))
        labels.append(noisy_label)
    return feat.to_dataframe(rows), np.array(labels)


def train_concern_severity_model(n_samples=4000):
    print(f"\n[Concern Severity Model] generating {n_samples} bootstrapped samples...")
    X, y = generate_concern_severity_training_data(n_samples)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.08, subsample=0.9,
        colsample_bytree=0.9, random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"[Concern Severity Model] XGBoost -> MAE: {mae:.2f}, R2: {r2:.3f}")

    joblib.dump({"model": model, "columns": list(X.columns)}, os.path.join(MODELS_DIR, "concern_severity_xgb.joblib"))
    print(f"Saved -> {os.path.join(MODELS_DIR, 'concern_severity_xgb.joblib')}")


def train_product_suitability_model(n_samples=4000):
    print(f"\n[Product Suitability Model] generating {n_samples} bootstrapped samples...")
    X, y = generate_product_suitability_training_data(n_samples)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = lgb.LGBMRegressor(
        n_estimators=200, max_depth=5, learning_rate=0.08, num_leaves=31, random_state=42, verbosity=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"[Product Suitability Model] LightGBM -> MAE: {mae:.2f}, R2: {r2:.3f}")

    joblib.dump({"model": model, "columns": list(X.columns)}, os.path.join(MODELS_DIR, "product_suitability_lgbm.joblib"))
    print(f"Saved -> {os.path.join(MODELS_DIR, 'product_suitability_lgbm.joblib')}")


if __name__ == "__main__":
    train_concern_severity_model()
    train_product_suitability_model()
    print("\nDone. The backend will automatically load these models on next restart")
    print("(see app/ml/predict.py) and use them instead of pure rule-based scoring.")
