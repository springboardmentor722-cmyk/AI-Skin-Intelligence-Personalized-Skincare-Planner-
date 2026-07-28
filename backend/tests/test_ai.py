"""AI skin-analysis tests — Milestone 3, Parts 4-8.

Covers the preprocessing, inference and postprocessing layers with deterministic
inputs. No network and no trained model required — these exercise the real code
paths that run when no ONNX file is present.
"""
import sys
from pathlib import Path

import cv2
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.ai import inference, postprocessing, preprocessing  # noqa: E402


def _solid_image(color=(180, 200, 220), size=300):
    img = np.full((size, size, 3), color, np.uint8)
    return cv2.imencode(".jpg", img)[1].tobytes()


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------
class TestPreprocessing:

    def test_load_rejects_empty(self):
        with pytest.raises(preprocessing.ImageValidationError):
            preprocessing.load_image(b"")

    def test_load_rejects_non_image(self):
        with pytest.raises(preprocessing.ImageValidationError):
            preprocessing.load_image(b"this is not an image")

    def test_validate_rejects_tiny(self):
        tiny = np.zeros((20, 20, 3), np.uint8)
        with pytest.raises(preprocessing.ImageValidationError):
            preprocessing.validate_image(tiny)

    def test_preprocess_without_face_requirement(self):
        pre = preprocessing.preprocess(_solid_image(), face_required=False)
        assert pre["tensor"].shape == (224, 224, 3)
        assert pre["tensor"].dtype == np.float32
        assert 0.0 <= float(pre["tensor"].min()) and float(pre["tensor"].max()) <= 1.0

    def test_preprocess_requires_face_when_asked(self):
        # a flat colour block has no face — but only enforced when a detector exists
        if not preprocessing.FACE_DETECTION_AVAILABLE:
            pytest.skip("no face detector in this OpenCV build")
        with pytest.raises(preprocessing.ImageValidationError):
            preprocessing.preprocess(_solid_image(), face_required=True)

    def test_feature_extraction_returns_all_signals(self):
        pre = preprocessing.preprocess(_solid_image(), face_required=False)
        feats = preprocessing.extract_features(pre["tensor"])
        for key in ("shine", "texture", "redness", "tone_variance",
                    "brightness", "saturation", "dryness", "dark_ratio"):
            assert key in feats

    def test_cascade_available_or_degrades(self):
        # Either the cascade loaded, or the build lacks it and we degrade safely.
        if preprocessing.FACE_DETECTION_AVAILABLE:
            assert not preprocessing._face_cascade.empty()
        else:
            assert preprocessing._face_cascade is None


# ---------------------------------------------------------------------------
# Inference (heuristic backend — no ONNX present)
# ---------------------------------------------------------------------------
class TestInference:

    def _features(self, **over):
        base = {"shine": 0.05, "texture": 100.0, "redness": 0.05,
                "tone_variance": 0.1, "brightness": 0.6, "saturation": 0.3,
                "dryness": 0.1, "dark_ratio": 0.05}
        base.update(over)
        return base

    def test_skin_type_returns_five_classes(self):
        probs, backend = inference.predict_skin_type(
            np.zeros((224, 224, 3), np.float32), self._features())
        assert set(probs.keys()) == set(inference.SKIN_TYPES)
        assert abs(sum(probs.values()) - 1.0) < 1e-5, "skin-type probs must sum to 1"
        assert backend == "heuristic"

    def test_high_shine_predicts_oily(self):
        probs, _ = inference.predict_skin_type(
            np.zeros((224, 224, 3), np.float32),
            self._features(shine=0.5, dryness=0.0))
        assert max(probs, key=probs.get) == "Oily"

    def test_high_dryness_predicts_dry(self):
        probs, _ = inference.predict_skin_type(
            np.zeros((224, 224, 3), np.float32),
            self._features(shine=0.0, dryness=0.8))
        assert max(probs, key=probs.get) == "Dry"

    def test_high_redness_predicts_sensitive(self):
        probs, _ = inference.predict_skin_type(
            np.zeros((224, 224, 3), np.float32),
            self._features(redness=0.6))
        assert max(probs, key=probs.get) == "Sensitive"

    def test_concerns_are_multilabel(self):
        probs, backend = inference.predict_skin_concerns(
            np.zeros((224, 224, 3), np.float32),
            self._features(shine=0.5, texture=400))
        assert set(probs.keys()) == set(inference.SKIN_CONCERNS)
        assert backend == "heuristic"
        # multi-label: probabilities are independent, need NOT sum to 1
        assert all(0 <= v <= 1 for v in probs.values())

    def test_inference_is_deterministic(self):
        f = self._features(shine=0.3)
        t = np.zeros((224, 224, 3), np.float32)
        a, _ = inference.predict_skin_type(t, f)
        b, _ = inference.predict_skin_type(t, f)
        assert a == b, "identical input must give identical output"


# ---------------------------------------------------------------------------
# Postprocessing
# ---------------------------------------------------------------------------
class TestPostprocessing:

    def test_finalize_skin_type_picks_top1(self):
        result = postprocessing.finalize_skin_type(
            {"Oily": 0.6, "Dry": 0.2, "Normal": 0.1, "Combination": 0.05, "Sensitive": 0.05})
        assert result["skin_type"] == "Oily"
        assert result["confidence"] == 0.6
        assert result["distribution"][0]["label"] == "Oily"

    def test_finalize_concerns_thresholds(self):
        probs = {c: 0.1 for c in inference.SKIN_CONCERNS}
        probs["Acne"] = 0.9
        probs["Redness"] = 0.8
        result = postprocessing.finalize_concerns(probs)
        names = [c["name"] for c in result["detected_concerns"]]
        assert "Acne" in names and "Redness" in names
        assert "Fine Lines" not in names       # below threshold
        assert result["priority_concern"] in ("Acne", "Redness")

    def test_severity_mapping(self):
        assert postprocessing.severity_from_confidence(0.8) == "high"
        assert postprocessing.severity_from_confidence(0.65) == "medium"
        assert postprocessing.severity_from_confidence(0.5) == "low"

    def test_explanation_is_built(self):
        st = postprocessing.finalize_skin_type({"Dry": 0.7, "Oily": 0.1, "Normal": 0.1,
                                                "Combination": 0.05, "Sensitive": 0.05})
        co = postprocessing.finalize_concerns({c: 0.1 for c in inference.SKIN_CONCERNS})
        feats = {"shine": 0.05, "dryness": 0.4, "redness": 0.05, "tone_variance": 0.1}
        text = postprocessing.build_explanation(st, co, feats, "heuristic")
        assert "Dry" in text and len(text) > 20
