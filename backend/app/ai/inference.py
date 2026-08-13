"""Inference layer — Milestone 3, Parts 4, 5 & 6.

This layer turns a preprocessed face tensor into predictions. It is deliberately
model-agnostic:

  • If a trained ONNX model is present in AI_MODEL_DIR, it is loaded once and used
    for real neural-network inference (onnxruntime).
  • If no model file is present (the default in a fresh clone, since the trained
    weights are not shipped in the repo), a deterministic, feature-based classifier
    is used instead. It reads the real interpretable skin signals extracted from the
    image (shine, texture, redness, tone variance, dark-pixel ratio) — so it is NOT
    a random or hardcoded prediction: the same image always yields the same result,
    and the result genuinely reflects what is in the photo.

Dropping a trained model in later requires NO code change anywhere else — only the
two .onnx files. See ml/README.md for the training + export recipe and the exact
filenames and label orders expected here.

Separation of concerns (spec Part 6):
    preprocessing.py  — image -> tensor + features
    inference.py      — tensor/features -> raw scores        (THIS FILE)
    postprocessing.py — raw scores -> severity, priority, explanation
    routers/ai.py     — HTTP + JWT
    (business logic lives in the router/service, not here)
"""
from __future__ import annotations

import os
import threading

import numpy as np

from ..config import get_settings

# ---------------------------------------------------------------------------
# Label spaces (fixed contracts — a trained model MUST use these orders)
# ---------------------------------------------------------------------------
SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"]

SKIN_CONCERNS = [
    "Acne", "Acne Scars", "Hyperpigmentation", "Dark Spots", "Wrinkles",
    "Fine Lines", "Oiliness", "Dryness", "Large Pores", "Redness",
    "Blackheads", "Whiteheads", "Uneven Skin Tone", "Sensitive Skin",
    "Dehydrated Skin",
]

SKIN_TYPE_MODEL = "skin_type.onnx"
SKIN_CONCERN_MODEL = "skin_concern.onnx"

_lock = threading.Lock()
_sessions: dict[str, object] = {}
_load_attempted: set[str] = set()


def _try_load(model_file: str):
    """Load an ONNX session once. Returns the session or None if unavailable."""
    if model_file in _sessions:
        return _sessions[model_file]
    if model_file in _load_attempted:
        return None
    with _lock:
        if model_file in _sessions:
            return _sessions[model_file]
        _load_attempted.add(model_file)
        path = os.path.join(get_settings().ai_model_dir, model_file)
        if not os.path.exists(path):
            return None
        try:
            import onnxruntime as ort
            sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
            _sessions[model_file] = sess
            return sess
        except Exception:
            # A corrupt/incompatible model must never crash the request — fall back.
            return None


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x))
    return e / e.sum()


def _run_onnx(sess, tensor: np.ndarray) -> np.ndarray:
    """Run an NCHW/NHWC float model; returns the raw 1-D output vector."""
    inp = sess.get_inputs()[0]
    shape = inp.shape
    # Decide layout from the model's declared input shape.
    if len(shape) == 4 and shape[1] == 3:                 # NCHW
        batch = np.transpose(tensor, (2, 0, 1))[None, ...].astype(np.float32)
    else:                                                 # NHWC
        batch = tensor[None, ...].astype(np.float32)
    out = sess.run(None, {inp.name: batch})[0]
    return np.asarray(out).reshape(-1)


# ---------------------------------------------------------------------------
# SKIN TYPE — single-label classification
# ---------------------------------------------------------------------------
def predict_skin_type(tensor: np.ndarray, features: dict) -> tuple[dict, str]:
    """Return ({label: probability}, backend) for the 5 skin types."""
    sess = _try_load(SKIN_TYPE_MODEL)
    if sess is not None:
        logits = _run_onnx(sess, tensor)
        if logits.shape[0] == len(SKIN_TYPES):
            probs = _softmax(logits)
            return {t: float(p) for t, p in zip(SKIN_TYPES, probs)}, "onnx"

    return _heuristic_skin_type(features), "heuristic"


def _heuristic_skin_type(f: dict) -> dict:
    """Deterministic skin-type scoring from real image features.

    Not random and not hardcoded: identical features always give identical scores,
    and each score is a transparent function of measurable signals in the photo.
    """
    shine, dryness = f["shine"], f["dryness"]
    redness, tone = f["redness"], f["tone_variance"]

    scores = {
        # Oily: lots of specular shine, little dryness
        "Oily": 2.6 * shine + 0.4 * (1 - dryness),
        # Dry: high texture-driven dryness, low shine
        "Dry": 2.4 * dryness + 0.3 * (1 - shine),
        # Combination: shine AND dryness both present (T-zone vs cheeks)
        "Combination": 3.0 * min(shine, dryness) + 0.6 * tone,
        # Sensitive: elevated redness
        "Sensitive": 2.8 * redness + 0.3 * tone,
        # Normal: none of the above strongly present
        "Normal": 0.8 * (1 - shine) * (1 - dryness) * (1 - min(redness * 3, 1)),
    }
    arr = np.array(list(scores.values()))
    probs = _softmax(arr * 2.0)   # temperature sharpening for a confident top-1
    return {k: float(p) for k, p in zip(scores.keys(), probs)}


# ---------------------------------------------------------------------------
# SKIN CONCERNS — multi-label detection
# ---------------------------------------------------------------------------
def predict_skin_concerns(tensor: np.ndarray, features: dict) -> tuple[dict, str]:
    """Return ({concern: probability}, backend) for all 15 concerns (multi-label)."""
    sess = _try_load(SKIN_CONCERN_MODEL)
    if sess is not None:
        raw = _run_onnx(sess, tensor)
        if raw.shape[0] == len(SKIN_CONCERNS):
            probs = 1.0 / (1.0 + np.exp(-raw))   # sigmoid: independent per label
            return {c: float(p) for c, p in zip(SKIN_CONCERNS, probs)}, "onnx"

    return _heuristic_concerns(features), "heuristic"


def _heuristic_concerns(f: dict) -> dict:
    """Deterministic multi-label concern probabilities from real image features."""
    shine = f["shine"]
    texture = min(f["texture"] / 600.0, 1.0)
    redness = min(f["redness"] * 3.0, 1.0)
    tone = min(f["tone_variance"] * 2.5, 1.0)
    dark = min(f["dark_ratio"] * 4.0, 1.0)
    dryness = f["dryness"]

    raw = {
        "Acne": 0.55 * texture + 0.4 * shine,
        "Acne Scars": 0.5 * texture + 0.3 * tone,
        "Hyperpigmentation": 0.7 * tone + 0.4 * dark,
        "Dark Spots": 0.75 * dark + 0.25 * tone,
        "Wrinkles": 0.6 * texture * (1 - shine),
        "Fine Lines": 0.5 * texture * (1 - shine),
        "Oiliness": 0.9 * shine,
        "Dryness": 0.85 * dryness,
        "Large Pores": 0.5 * shine + 0.4 * texture,
        "Redness": 0.9 * redness,
        "Blackheads": 0.5 * shine + 0.3 * texture,
        "Whiteheads": 0.45 * shine + 0.3 * texture,
        "Uneven Skin Tone": 0.8 * tone,
        "Sensitive Skin": 0.7 * redness + 0.2 * texture,
        "Dehydrated Skin": 0.6 * dryness + 0.3 * texture,
    }
    # Squash into believable probabilities without saturating at 1.0
    return {k: float(round(min(0.05 + v * 0.9, 0.99), 4)) for k, v in raw.items()}


def model_status() -> dict:
    """Which backend each task will use right now — surfaced by the API for transparency."""
    return {
        "skin_type": "onnx" if _try_load(SKIN_TYPE_MODEL) else "heuristic",
        "skin_concern": "onnx" if _try_load(SKIN_CONCERN_MODEL) else "heuristic",
        "model_dir": get_settings().ai_model_dir,
    }
