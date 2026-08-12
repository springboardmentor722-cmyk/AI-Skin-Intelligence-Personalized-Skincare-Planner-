"""
Face landmark extraction and region-of-interest cropping using MediaPipe Face Mesh.
This isolates the skin regions (forehead, cheeks, nose, chin, under-eye) that get
passed to the skin-condition models, so the model isn't confused by hair/background/clothing.
"""

import cv2
import numpy as np
import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh

# Landmark index groups (MediaPipe 468-point mesh) for key skin regions
REGIONS = {
    "forehead": [10, 338, 297, 332, 284, 251, 389, 356, 454, 21, 71, 68, 54, 103, 67, 109],
    "left_cheek": [187, 205, 36, 142, 126, 217, 174, 196],
    "right_cheek": [411, 425, 266, 371, 355, 437, 399, 419],
    "nose": [168, 6, 197, 195, 5, 4, 45, 275],
    "chin": [199, 175, 152, 377, 400, 378, 379],
    "under_eye_left": [33, 7, 163, 144, 145, 153, 154, 155],
    "under_eye_right": [263, 249, 390, 373, 374, 380, 381, 382],
}


class FaceMeshExtractor:
    def __init__(self, static_mode: bool = True, max_faces: int = 1, min_confidence: float = 0.6):
        self.detector = mp_face_mesh.FaceMesh(
            static_image_mode=static_mode,
            max_num_faces=max_faces,
            refine_landmarks=True,
            min_detection_confidence=min_confidence,
        )

    def extract(self, image_bgr: np.ndarray) -> dict:
        h, w = image_bgr.shape[:2]
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        results = self.detector.process(image_rgb)

        if not results.multi_face_landmarks:
            return {"face_detected": False, "regions": {}, "landmarks": None}

        landmarks = results.multi_face_landmarks[0].landmark
        points = np.array([(int(lm.x * w), int(lm.y * h)) for lm in landmarks])

        regions_crops = {}
        for region_name, idx_list in REGIONS.items():
            region_pts = points[idx_list]
            x, y, rw, rh = cv2.boundingRect(region_pts)
            pad = 5
            x0, y0 = max(0, x - pad), max(0, y - pad)
            x1, y1 = min(w, x + rw + pad), min(h, y + rh + pad)
            crop = image_bgr[y0:y1, x0:x1]
            if crop.size > 0:
                regions_crops[region_name] = crop

        return {
            "face_detected": True,
            "regions": regions_crops,
            "landmarks": points,
            "image_shape": (h, w),
        }

    def close(self):
        self.detector.close()
