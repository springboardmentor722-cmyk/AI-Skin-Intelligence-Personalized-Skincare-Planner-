"""Image preprocessing layer — Milestone 3, Parts 7 & 8.

Pure computer-vision utilities with NO knowledge of the web layer or the database.
This separation (preprocessing / inference / postprocessing / API / business) is a
hard requirement of the spec: a newer model can replace the inference layer without
touching any of this.

Pipeline stages, in order:
    load -> validate -> detect face -> crop (with margin) -> resize -> normalize
"""
from __future__ import annotations

import io
import os

import cv2
import numpy as np

# Face detection uses OpenCV's Haar cascade. Different OpenCV wheels ship the
# cascade XML in different places (and some headless builds omit it, or omit the
# CascadeClassifier API entirely). We locate it defensively and degrade
# gracefully: if no cascade is available, detection returns "no boxes" rather
# than crashing at import — the app still runs, and the router treats a missing
# detector as "face not verified" instead of an error.
def _load_face_cascade():
    candidates = []
    data_dir = getattr(cv2, "data", None)
    if data_dir is not None and getattr(data_dir, "haarcascades", None):
        candidates.append(os.path.join(cv2.data.haarcascades,
                                       "haarcascade_frontalface_default.xml"))
    candidates.append(os.path.join(os.path.dirname(cv2.__file__), "data",
                                   "haarcascade_frontalface_default.xml"))
    # Bundled copy shipped with this project (guarantees offline availability)
    candidates.append(os.path.join(os.path.dirname(__file__), "assets",
                                   "haarcascade_frontalface_default.xml"))
    if not hasattr(cv2, "CascadeClassifier"):
        return None
    for path in candidates:
        try:
            if path and os.path.exists(path):
                clf = cv2.CascadeClassifier(path)
                if not clf.empty():
                    return clf
        except Exception:
            continue
    return None


_face_cascade = _load_face_cascade()
FACE_DETECTION_AVAILABLE = _face_cascade is not None

ALLOWED_FORMATS = {"jpeg", "jpg", "png", "webp", "bmp"}
MODEL_INPUT_SIZE = (224, 224)   # standard for MobileNet/EfficientNet-class backbones


class ImageValidationError(ValueError):
    """Raised when an upload is not a usable facial image. Carries a safe message."""


def load_image(raw: bytes) -> np.ndarray:
    """Decode raw bytes into a BGR image, or raise ImageValidationError."""
    if not raw:
        raise ImageValidationError("The uploaded file is empty.")
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ImageValidationError(
            "That file could not be read as an image. Use JPG, PNG or WEBP.")
    return img


def validate_image(img: np.ndarray) -> None:
    """Sanity-check dimensions before doing any expensive work."""
    h, w = img.shape[:2]
    if h < 100 or w < 100:
        raise ImageValidationError(
            "Image is too small for reliable analysis — use at least 100x100 px.")
    if h > 6000 or w > 6000:
        raise ImageValidationError("Image is unexpectedly large. Please resize and retry.")


def detect_face(img: np.ndarray) -> tuple[int, int, int, int] | None:
    """Return the largest face box (x, y, w, h), or None if no face is found.

    Returns None when face detection is unavailable in this OpenCV build; callers
    treat that as "face not verified" rather than an error.
    """
    if _face_cascade is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5,
                                           minSize=(80, 80))
    if len(faces) == 0:
        return None
    # The subject's face is the biggest box.
    return tuple(max(faces, key=lambda f: f[2] * f[3]))


def crop_face(img: np.ndarray, box: tuple[int, int, int, int],
              margin: float = 0.25) -> np.ndarray:
    """Crop to the face with a margin so the whole cheek/forehead area is kept."""
    x, y, w, h = box
    mx, my = int(w * margin), int(h * margin)
    x0, y0 = max(0, x - mx), max(0, y - my)
    x1, y1 = min(img.shape[1], x + w + mx), min(img.shape[0], y + h + my)
    return img[y0:y1, x0:x1]


def resize(img: np.ndarray, size: tuple[int, int] = MODEL_INPUT_SIZE) -> np.ndarray:
    return cv2.resize(img, size, interpolation=cv2.INTER_AREA)


def normalize(img: np.ndarray) -> np.ndarray:
    """Scale to [0, 1] float32 and convert BGR->RGB, ready for a model tensor."""
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return (rgb.astype(np.float32) / 255.0)


def preprocess(raw: bytes, face_required: bool = True) -> dict:
    """Run the full pipeline and return everything the inference layer needs.

    Returns:
        {
          "tensor": np.float32 [224,224,3] in [0,1],
          "face_found": bool,
          "face_box": (x,y,w,h) | None,
          "crop_bgr": np.uint8 cropped face (for optional visualisation),
          "original_size": (w, h),
        }
    Raises ImageValidationError on unusable input or (if face_required) no face.
    """
    img = load_image(raw)
    validate_image(img)

    box = detect_face(img)
    # Only reject "no face" when the detector is actually available. If this
    # OpenCV build can't detect faces, we proceed on the whole image rather than
    # blocking the user — analysis still runs on the real pixels.
    if box is None and face_required and FACE_DETECTION_AVAILABLE:
        raise ImageValidationError(
            "No face detected. Use a clear, well-lit, front-facing photo of your face.")

    crop = crop_face(img, box) if box is not None else img
    resized = resize(crop)
    tensor = normalize(resized)

    return {
        "tensor": tensor,
        "face_found": box is not None,
        "face_box": tuple(int(v) for v in box) if box is not None else None,
        "crop_bgr": crop,
        "original_size": (img.shape[1], img.shape[0]),
    }


def extract_features(tensor: np.ndarray) -> dict:
    """Interpretable skin-signal features from a normalized face tensor.

    These are real, deterministic measurements from the image (colour statistics,
    local texture/variance, specular-highlight ratio, redness in the a* channel).
    The heuristic model consumes them when no trained CNN is installed, and they
    also drive the human-readable prediction explanation either way.
    """
    rgb = (tensor * 255.0).astype(np.uint8)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    # Specular highlights (very bright, low-saturation pixels) => oiliness/shine
    shine = float(np.mean((V > 200) & (S < 40)))
    # Local texture energy (Laplacian variance) => roughness/flaking when high on dry skin
    texture = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    # Redness: elevated a* in LAB => redness/sensitivity
    redness = float(np.mean(np.clip(A - 128, 0, None)) / 128.0)
    # Tone unevenness: spread of L across the face
    tone_var = float(np.std(L) / 128.0)
    # Overall brightness & saturation
    brightness = float(np.mean(V) / 255.0)
    saturation = float(np.mean(S) / 255.0)
    # Dryness proxy: high texture + low shine
    dryness = float(np.clip(texture / 500.0, 0, 1) * (1.0 - shine))
    # Darkness pockets (potential spots / pigmentation): fraction of dark pixels
    dark_ratio = float(np.mean(V < 80))

    return {
        "shine": round(shine, 4),
        "texture": round(texture, 2),
        "redness": round(redness, 4),
        "tone_variance": round(tone_var, 4),
        "brightness": round(brightness, 4),
        "saturation": round(saturation, 4),
        "dryness": round(dryness, 4),
        "dark_ratio": round(dark_ratio, 4),
    }
