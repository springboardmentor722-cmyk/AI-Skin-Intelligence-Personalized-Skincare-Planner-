"""
Loads the trained ML models (if present) and exposes predict functions with
the exact same shape as the rule-based engine functions, so routers can call
either interchangeably. If the model files don't exist yet (fresh clone,
before anyone has run `python -m app.ml.train_models`), everything falls back
to the pure rule-based engine automatically -- the app never breaks because
ML models are missing, it just runs in "rules-only" mode until you train them.
"""
import os
import logging
import joblib
import pandas as pd

from . import features as feat

logger = logging.getLogger(__name__)
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

_concern_model = None
_concern_columns = None
_product_model = None
_product_columns = None


def _try_load():
    global _concern_model, _concern_columns, _product_model, _product_columns

    concern_path = os.path.join(MODELS_DIR, "concern_severity_xgb.joblib")
    if os.path.exists(concern_path):
        try:
            bundle = joblib.load(concern_path)
            _concern_model = bundle["model"]
            _concern_columns = bundle["columns"]
            logger.info("Loaded trained XGBoost concern-severity model.")
        except Exception as e:  # noqa: BLE001
            logger.warning("Failed to load concern severity model: %s", e)

    product_path = os.path.join(MODELS_DIR, "product_suitability_lgbm.joblib")
    if os.path.exists(product_path):
        try:
            bundle = joblib.load(product_path)
            _product_model = bundle["model"]
            _product_columns = bundle["columns"]
            logger.info("Loaded trained LightGBM product-suitability model.")
        except Exception as e:  # noqa: BLE001
            logger.warning("Failed to load product suitability model: %s", e)


_try_load()


def models_available() -> dict:
    return {
        "concern_severity_model_loaded": _concern_model is not None,
        "product_suitability_model_loaded": _product_model is not None,
    }


def _align_columns(row: dict, columns) -> pd.DataFrame:
    df = pd.DataFrame([row])
    for col in columns:
        if col not in df.columns:
            df[col] = 0
    return df[columns]


def predict_concern_severity(profile_dict: dict, concern: str, fallback_fn) -> tuple:
    """
    Returns (score, method) where method is "ml" or "rules" so the API can be
    transparent with the frontend about which one produced the number.
    fallback_fn: a zero-arg callable that returns the rule-based score,
    passed in by the caller (usually engine.concern_severity_score bound to
    the real SQLAlchemy profile object) so this module doesn't need to know
    about SQLAlchemy models at all.
    """
    if _concern_model is None:
        return fallback_fn(), "rules"
    try:
        row = feat.concern_severity_features(profile_dict, concern)
        X = _align_columns(row, _concern_columns)
        score = float(_concern_model.predict(X)[0])
        return round(max(0, min(100, score)), 1), "ml"
    except Exception as e:  # noqa: BLE001
        logger.warning("ML concern severity prediction failed, falling back to rules: %s", e)
        return fallback_fn(), "rules"


def predict_product_suitability(profile_dict: dict, product_dict: dict, fallback_fn) -> tuple:
    if _product_model is None:
        return fallback_fn(), "rules"
    try:
        row = feat.product_suitability_features(profile_dict, product_dict)
        X = _align_columns(row, _product_columns)
        score = float(_product_model.predict(X)[0])
        return round(max(0, min(100, score)), 1), "ml"
    except Exception as e:  # noqa: BLE001
        logger.warning("ML product suitability prediction failed, falling back to rules: %s", e)
        return fallback_fn(), "rules"
