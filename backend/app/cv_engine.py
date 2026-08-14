"""
Photo-based visual analysis using classic computer vision (OpenCV), not a
trained deep-learning diagnostic model.

WHAT THIS DOES: extracts objective, measurable visual signals from a face
photo -- redness, texture roughness, tone evenness, and shine/oiliness --
using color-space analysis and edge/variance measurements. These signals are
blended into the existing rule/ML-based assessment as additional evidence
(see engine.blend_photo_signals), the same way a skin-analysis kiosk at a
dermatology clinic or beauty counter reports measurements for a person to
discuss with a professional.

WHAT THIS DOES NOT DO: it does not diagnose any medical condition (acne
grade, rosacea, eczema, melanoma, etc.), and it must never be presented to
the user as a diagnosis. Every response includes an explicit disclaimer, and
the platform's verified-dermatologist review flow (see routers/verification.py)
exists specifically so a human professional is the one who interprets
anything clinically meaningful. If you extend this module, keep that
boundary -- return measurements and observations, not diagnoses.

Method notes (for your internship write-up / viva):
- Face detection: Haar cascade classifier bundled with opencv-python
  (no external model download required).
- Skin segmentation: YCrCb color-space thresholding, a standard classic
  technique for isolating skin-toned pixels regardless of lighting.
- Redness: mean of the LAB color space's "a*" channel (the green-red axis)
  within the skin mask.
- Texture/roughness proxy: variance of the Laplacian (a standard blur/edge-
  detail measure) within the face region.
- Tone evenness: inverse of the standard deviation of the LAB "L*"
  (lightness) channel within the skin mask.
- Oiliness/shine proxy: percentage of skin-mask pixels that are very bright
  and low-saturation (specular highlight-like).
"""
from typing import Optional
import numpy as np
import cv2

_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def _clip(value: float, lo: float = 0, hi: float = 100) -> float:
    return float(max(lo, min(hi, value)))


def _skin_mask(bgr_image: np.ndarray) -> np.ndarray:
    ycrcb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2YCrCb)
    lower = np.array((0, 135, 85), dtype=np.uint8)
    upper = np.array((255, 180, 135), dtype=np.uint8)
    mask = cv2.inRange(ycrcb, lower, upper)
    mask = cv2.medianBlur(mask, 5)
    return mask


def analyze_face_photo(image_bytes: bytes) -> dict:
    """
    Runs the full pipeline on raw image bytes. Returns a dict matching the
    SkinPhoto model's analysis fields, always safe to call (never raises --
    a failure mode is reported in `notes` instead, since this runs inside a
    user-facing upload endpoint).
    """
    notes = []
    try:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return {
                "face_detected": False, "redness_score": None, "texture_score": None,
                "evenness_score": None, "oiliness_score": None,
                "notes": ["Could not read this image file. Try a standard JPG or PNG photo."],
            }
    except Exception:
        return {
            "face_detected": False, "redness_score": None, "texture_score": None,
            "evenness_score": None, "oiliness_score": None,
            "notes": ["Could not read this image file. Try a standard JPG or PNG photo."],
        }

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    if len(faces) == 0:
        return {
            "face_detected": False, "redness_score": None, "texture_score": None,
            "evenness_score": None, "oiliness_score": None,
            "notes": ["No face clearly detected. Use a well-lit, front-facing photo with your face filling most of the frame."],
        }

    # Use the largest detected face (closest to camera / most prominent).
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    pad_x, pad_y = int(w * 0.1), int(h * 0.1)
    x0, y0 = max(0, x - pad_x), max(0, y - pad_y)
    x1, y1 = min(img.shape[1], x + w + pad_x), min(img.shape[0], y + h + pad_y)
    face_roi = img[y0:y1, x0:x1]
    face_roi = cv2.resize(face_roi, (400, 400))

    mask = _skin_mask(face_roi)
    skin_pixel_count = int(np.count_nonzero(mask))
    if skin_pixel_count < 500:
        notes.append("Skin region was hard to isolate reliably in this photo (lighting/angle) -- treat scores as rough estimates.")

    lab = cv2.cvtColor(face_roi, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, _B = cv2.split(lab)

    if skin_pixel_count > 0:
        masked_a = A[mask > 0]
        masked_l = L[mask > 0]
        # Redness: LAB a* for skin tones under normal lighting typically falls
        # roughly in the 128-176 range in OpenCV's 0-255 encoding; 130 is used
        # as a low-redness anchor so the score has headroom in both directions.
        redness_raw = float(np.mean(masked_a))
        redness_score = _clip((redness_raw - 130) * 2.2)

        # Evenness: lower stddev of lightness = more even tone. Typical
        # well-lit, evenly-toned face crops fall roughly in the 15-45 stddev
        # range; scaled so that range maps to a readable 50-95 evenness band.
        l_std = float(np.std(masked_l))
        evenness_score = _clip(100 - l_std * 1.1)

        # Oiliness: fraction of skin pixels that are bright + low-saturation (specular highlight-like).
        hsv = cv2.cvtColor(face_roi, cv2.COLOR_BGR2HSV)
        v_channel = hsv[:, :, 2][mask > 0]
        s_channel = hsv[:, :, 1][mask > 0]
        shine_pixels = int(np.count_nonzero((v_channel > 210) & (s_channel < 70)))
        shine_pct = (shine_pixels / max(1, skin_pixel_count)) * 100
        oiliness_score = _clip(shine_pct * 3.5)
    else:
        redness_score = evenness_score = oiliness_score = None

    # Texture/roughness proxy: Laplacian variance over the whole face region (not just masked skin,
    # since texture at pore/line level is what we want, not just color). Laplacian variance has a
    # very wide, resolution-dependent dynamic range, so it's compressed with a square root before
    # scaling -- otherwise sharp/high-res phone photos would all saturate to 100.
    laplacian_var = float(cv2.Laplacian(cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
    texture_score = _clip(np.sqrt(laplacian_var) * 5)

    if redness_score is not None and redness_score > 65:
        notes.append("Elevated redness detected in the skin-toned regions of this photo.")
    if evenness_score is not None and evenness_score < 55:
        notes.append("Tone appears less even across the face than typical.")
    if oiliness_score is not None and oiliness_score > 55:
        notes.append("Noticeable shine/specular highlights detected, consistent with higher oil levels.")
    if texture_score > 70:
        notes.append("Higher visible surface texture detected (could reflect roughness, fine lines, or just photo sharpness/lighting).")
    if not notes:
        notes.append("No strong signals detected -- skin appears visually balanced in this photo.")

    notes.append("These are visual estimates from image analysis, not a medical diagnosis. For a clinical read, use the dermatologist review feature.")

    return {
        "face_detected": True,
        "redness_score": redness_score,
        "texture_score": texture_score,
        "evenness_score": evenness_score,
        "oiliness_score": oiliness_score,
        "notes": notes,
    }
