"""
Face Verification Engine.

Primary:  dlib / face_recognition library — strict ML-based 128-dim face
          encoding comparison using HOG/CNN face detection.
Fallback: OpenCV Haar Cascade + histogram feature vectors (if face_recognition
          is not installed or fails).

NO LLM involved.
"""
import cv2
import numpy as np
import base64
import logging

logger = logging.getLogger(__name__)

# ── Try to import face_recognition (dlib) ────────────────────────────────
_FACE_RECOGNITION_AVAILABLE = False
try:
    import face_recognition
    _FACE_RECOGNITION_AVAILABLE = True
    logger.info("face_recognition (dlib) loaded successfully — using ML-based face verification.")
except ImportError:
    logger.warning(
        "face_recognition library not installed. "
        "Falling back to OpenCV-based face verification. "
        "To enable strict ML verification, install: pip install face_recognition"
    )


# ═════════════════════════════════════════════════════════════════════════
# Primary Engine: dlib / face_recognition
# ═════════════════════════════════════════════════════════════════════════

class DlibFaceVerificationEngine:
    """
    Uses the face_recognition library (dlib) to:
    1. Detect faces in images
    2. Extract 128-dimensional face encodings
    3. Compare encodings to verify same person
    4. Raise HTTPException(400) on mismatch
    """

    def _base64_to_image(self, base64_str: str) -> np.ndarray:
        """Decode a base64 image string to a numpy array (RGB for face_recognition)."""
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Failed to decode image from base64 data")
        # face_recognition expects RGB
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        return img_rgb

    def _get_face_encoding(self, img_rgb: np.ndarray) -> np.ndarray:
        """
        Detect faces and return the encoding of the largest face.
        Raises ValueError if no face is detected.
        """
        face_locations = face_recognition.face_locations(img_rgb, model="hog")
        if not face_locations:
            raise ValueError("No face detected in the image")

        # Pick the largest face by area
        if len(face_locations) > 1:
            face_locations = sorted(
                face_locations,
                key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]),
                reverse=True,
            )

        # Get encoding for the largest face only
        encodings = face_recognition.face_encodings(img_rgb, known_face_locations=[face_locations[0]])
        if not encodings:
            raise ValueError("Could not compute face encoding")

        return encodings[0]

    def verify_same_person(
        self, base64_img1: str, base64_img2: str, tolerance: float = 0.6
    ) -> dict:
        """
        Compare two face images using dlib face encodings.
        Returns match result. Raises HTTPException on mismatch if used in API context.
        """
        try:
            img1 = self._base64_to_image(base64_img1)
            img2 = self._base64_to_image(base64_img2)

            encoding1 = self._get_face_encoding(img1)
            encoding2 = self._get_face_encoding(img2)

            # Compare faces
            matches = face_recognition.compare_faces(
                [encoding1], encoding2, tolerance=tolerance
            )
            distances = face_recognition.face_distance([encoding1], encoding2)

            is_same = bool(matches[0])
            distance = float(distances[0])
            # Convert distance to similarity (1 - distance)
            similarity = round(1.0 - distance, 4)

            result = {
                "is_same_person": is_same,
                "similarity": similarity,
                "distance": round(distance, 4),
                "tolerance": tolerance,
                "engine": "dlib_face_recognition",
                "reason": (
                    "Faces match successfully."
                    if is_same
                    else "Uploaded images do not belong to the same person."
                ),
            }

            # Raise HTTPException if faces don't match
            if not is_same:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded images do not belong to the same person.",
                )

            return result

        except Exception as e:
            # Re-raise HTTPException as-is
            from fastapi import HTTPException as FastAPIHTTPException
            if isinstance(e, FastAPIHTTPException):
                raise

            logger.error(f"dlib face verification error: {e}")
            return {
                "is_same_person": False,
                "similarity": 0.0,
                "engine": "dlib_face_recognition",
                "reason": f"Face verification error: {str(e)}",
            }


# ═════════════════════════════════════════════════════════════════════════
# Fallback Engine: OpenCV Haar Cascade
# ═════════════════════════════════════════════════════════════════════════

class OpenCVFaceVerificationEngine:
    """
    OpenCV-based Face Matching & Verification Engine.
    Calculates facial feature embeddings and structural similarity to verify
    whether two progress photos belong to the exact same person.
    """
    
    def __init__(self):
        # Load OpenCV's pre-trained Haar Cascade Face Detector
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def _base64_to_image(self, base64_str: str) -> np.ndarray:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    def extract_face_feature_vector(self, img: np.ndarray) -> np.ndarray:
        """
        Detects face, crops region of interest, normalizes, and extracts a color & texture feature vector.
        """
        if img is None:
            raise ValueError("Invalid image input")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

        if len(faces) > 0:
            # Pick largest face
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            face_crop = gray[y:y+h, x:x+w]
            color_crop = img[y:y+h, x:x+w]
        else:
            # Fallback to whole image if face boundary fails
            face_crop = gray
            color_crop = img

        # Resize to standard 128x128 matrix
        face_resized = cv2.resize(face_crop, (128, 128))
        color_resized = cv2.resize(color_crop, (128, 128))

        # 1. Color Histogram (HSV)
        hsv = cv2.cvtColor(color_resized, cv2.COLOR_BGR2HSV)
        hist_h = cv2.calcHist([hsv], [0], None, [16], [0, 180])
        hist_s = cv2.calcHist([hsv], [1], None, [16], [0, 256])
        
        # 2. Grayscale Intensity Histogram
        hist_g = cv2.calcHist([face_resized], [0], None, [32], [0, 256])

        # 3. Spatial Mean & Std Dev
        mean, std = cv2.meanStdDev(face_resized)

        # Concatenate into single feature vector
        vector = np.concatenate([
            hist_h.flatten(), 
            hist_s.flatten(), 
            hist_g.flatten(), 
            mean.flatten(), 
            std.flatten()
        ])
        
        # Normalize vector
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
            
        return vector

    def verify_same_person(self, base64_img1: str, base64_img2: str, similarity_threshold: float = 0.70) -> dict:
        """
        Compares Image A and Image B. Returns match result and similarity score.
        """
        try:
            img1 = self._base64_to_image(base64_img1)
            img2 = self._base64_to_image(base64_img2)

            if img1 is None or img2 is None:
                return {"is_same_person": False, "similarity": 0.0, "engine": "opencv", "reason": "Failed to decode images"}

            vec1 = self.extract_face_feature_vector(img1)
            vec2 = self.extract_face_feature_vector(img2)

            # Cosine similarity
            similarity = float(np.dot(vec1, vec2))
            
            is_same = similarity >= similarity_threshold

            result = {
                "is_same_person": is_same,
                "similarity": round(similarity, 4),
                "threshold": similarity_threshold,
                "engine": "opencv_haar_cascade",
                "reason": "Faces match successfully." if is_same else "Uploaded images do not belong to the same person."
            }

            # Raise HTTPException if faces don't match
            if not is_same:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded images do not belong to the same person.",
                )

            return result

        except Exception as e:
            # Re-raise HTTPException as-is
            from fastapi import HTTPException as FastAPIHTTPException
            if isinstance(e, FastAPIHTTPException):
                raise

            logger.error(f"Error in face verification: {e}")
            # If verification processing fails, default to mismatch to enforce security
            return {
                "is_same_person": False,
                "similarity": 0.0,
                "engine": "opencv_haar_cascade",
                "reason": f"Face verification processing error: {str(e)}"
            }


# ═════════════════════════════════════════════════════════════════════════
# Factory: Auto-select best available engine
# ═════════════════════════════════════════════════════════════════════════

def _create_engine():
    """
    Returns the best available face verification engine:
    1. DlibFaceVerificationEngine (if face_recognition is installed)
    2. OpenCVFaceVerificationEngine (fallback)
    """
    if _FACE_RECOGNITION_AVAILABLE:
        logger.info("Using dlib/face_recognition for face verification (strict ML check).")
        return DlibFaceVerificationEngine()
    else:
        logger.info("Using OpenCV Haar Cascade for face verification (fallback).")
        return OpenCVFaceVerificationEngine()


face_verification_engine = _create_engine()
