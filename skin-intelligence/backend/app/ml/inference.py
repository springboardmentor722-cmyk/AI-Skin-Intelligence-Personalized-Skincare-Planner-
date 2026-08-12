"""
Inference layer for skin condition analysis.

Design: separate lightweight models per concern (not one giant multi-head net),
so each can be retrained/swapped independently as you collect more labeled data.

    - skin_type_classifier.h5      (ResNet18/TF, transfer-learned)  -> oily/dry/combination/normal
    - concern_multilabel.h5        (multi-label CNN)                -> acne/redness/pigmentation/pores present
    - wrinkle_regressor.pkl        (sklearn GradientBoosting)        -> wrinkle severity 0-100
    - skin_age_regressor.pkl       (sklearn)                         -> estimated age delta

In production these are loaded once at startup (see app.main lifespan) and reused.
Until trained weights exist, `SkinAnalyzer` falls back to deterministic OpenCV
heuristics (texture variance, redness channel ratio, etc.) so the API contract
and downstream scoring/routine logic can be built and tested end-to-end today.
"""

import os
import numpy as np
import cv2
from dataclasses import dataclass, asdict
from app.ml.face_mesh import FaceMeshExtractor
from app.services.skin_score import SkinConditionInput

MODEL_DIR = os.getenv("MODEL_DIR", "./app/ml/weights")


@dataclass
class SkinAnalysisResult:
    skin_type: str
    acne_severity: float          # 0 (severe) - 100 (clear)
    redness_level: float
    wrinkle_severity: float
    pigmentation_level: float
    pore_visibility: float
    oiliness_level: float
    dryness_level: float
    dark_circles_severity: float
    estimated_skin_age: int
    skin_tone_hex: str
    confidence: float

    def to_score_input(self) -> SkinConditionInput:
        return SkinConditionInput(
            acne_clarity=self.acne_severity,
            redness_control=self.redness_level,
            wrinkle_smoothness=self.wrinkle_severity,
            pigmentation_evenness=self.pigmentation_level,
            pore_refinement=self.pore_visibility,
            oil_balance=100 - abs(self.oiliness_level - self.dryness_level),
            hydration_of_skin=100 - self.dryness_level,
            dark_circle_lightness=self.dark_circles_severity,
        )


class SkinAnalyzer:
    def __init__(self):
        self.mesh_extractor = FaceMeshExtractor()
        self._tf_models_loaded = self._try_load_trained_models()

    def _try_load_trained_models(self) -> bool:
        """Attempt to load trained model weights; return False to use heuristic fallback."""
        required = ["skin_type_classifier.h5", "concern_multilabel.h5"]
        return all(os.path.exists(os.path.join(MODEL_DIR, f)) for f in required)

    def analyze(self, image_bgr: np.ndarray) -> SkinAnalysisResult:
        mesh_data = self.mesh_extractor.extract(image_bgr)
        if not mesh_data["face_detected"]:
            raise ValueError("No face detected in image. Please retake photo with clear frontal face view.")

        regions = mesh_data["regions"]

        if self._tf_models_loaded:
            return self._infer_with_trained_models(image_bgr, regions)
        return self._infer_with_heuristics(image_bgr, regions)

    # ---- Heuristic fallback (OpenCV signal processing) ----
    def _infer_with_heuristics(self, image_bgr: np.ndarray, regions: dict) -> SkinAnalysisResult:
        forehead = regions.get("forehead", image_bgr)
        cheek = regions.get("left_cheek", image_bgr)
        under_eye = regions.get("under_eye_left", image_bgr)

        redness = self._redness_ratio(cheek)
        texture_var = self._texture_variance(forehead)  # proxy for pores/wrinkles
        brightness = self._mean_brightness(image_bgr)
        dark_circle_delta = self._darkness_delta(under_eye, cheek)
        tone_hex = self._dominant_skin_tone(cheek)

        oiliness = float(np.clip(100 - brightness * 0.4, 0, 100))
        dryness = float(np.clip(brightness * 0.3, 0, 100))

        return SkinAnalysisResult(
            skin_type="oily" if oiliness > 60 else ("dry" if dryness > 60 else "combination"),
            acne_severity=float(np.clip(100 - redness * 1.2, 0, 100)),
            redness_level=float(np.clip(100 - redness, 0, 100)),
            wrinkle_severity=float(np.clip(100 - texture_var / 3, 0, 100)),
            pigmentation_level=float(np.clip(100 - abs(brightness - 128) / 1.28, 0, 100)),
            pore_visibility=float(np.clip(100 - texture_var / 2.5, 0, 100)),
            oiliness_level=oiliness,
            dryness_level=dryness,
            dark_circles_severity=float(np.clip(100 - dark_circle_delta * 2, 0, 100)),
            estimated_skin_age=int(np.clip(20 + texture_var / 10, 16, 65)),
            skin_tone_hex=tone_hex,
            confidence=0.55,  # heuristic fallback -> lower confidence, flagged to frontend
        )

    def _infer_with_trained_models(self, image_bgr: np.ndarray, regions: dict) -> SkinAnalysisResult:
        # Placeholder for real TF inference once weights from your 8-week training
        # roadmap (ResNet18 skin-type classifier + multi-label concern classifier)
        # are exported to MODEL_DIR. Structure kept identical to heuristic path so
        # swapping in real models requires no API/schema changes.
        raise NotImplementedError("Trained model loading not yet wired — add TF model load + predict here")

    @staticmethod
    def _redness_ratio(region: np.ndarray) -> float:
        if region.size == 0:
            return 50.0
        b, g, r = cv2.split(region.astype(np.float32))
        ratio = np.mean(r) / (np.mean(g) + np.mean(b) + 1e-5)
        return float(np.clip(ratio * 100, 0, 100))

    @staticmethod
    def _texture_variance(region: np.ndarray) -> float:
        if region.size == 0:
            return 50.0
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    @staticmethod
    def _mean_brightness(image: np.ndarray) -> float:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return float(np.mean(gray))

    @staticmethod
    def _darkness_delta(under_eye: np.ndarray, cheek: np.ndarray) -> float:
        if under_eye.size == 0 or cheek.size == 0:
            return 0.0
        eye_brightness = np.mean(cv2.cvtColor(under_eye, cv2.COLOR_BGR2GRAY))
        cheek_brightness = np.mean(cv2.cvtColor(cheek, cv2.COLOR_BGR2GRAY))
        return float(np.clip(cheek_brightness - eye_brightness, 0, 100))

    @staticmethod
    def _dominant_skin_tone(region: np.ndarray) -> str:
        if region.size == 0:
            return "#C68863"
        pixels = region.reshape(-1, 3).astype(np.float32)
        mean_bgr = np.mean(pixels, axis=0)
        b, g, r = mean_bgr
        return f"#{int(r):02x}{int(g):02x}{int(b):02x}"
