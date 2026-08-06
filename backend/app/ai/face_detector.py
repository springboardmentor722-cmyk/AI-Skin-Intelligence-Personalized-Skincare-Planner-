import cv2
import mediapipe as mp

mp_face = mp.solutions.face_detection


def crop_face(image_path: str):
    """
    Detects the largest face and crops it.
    Returns the cropped image.
    """

    image = cv2.imread(image_path)

    if image is None:
        raise Exception("Unable to read image.")

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    with mp_face.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.6
    ) as detector:

        results = detector.process(rgb)

        if not results.detections:
            raise Exception("No face detected.")

        detection = results.detections[0]

        bbox = detection.location_data.relative_bounding_box

        h, w, _ = image.shape

        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        bw = int(bbox.width * w)
        bh = int(bbox.height * h)

        padding = 30

        x = max(0, x - padding)
        y = max(0, y - padding)

        bw = min(w - x, bw + padding * 2)
        bh = min(h - y, bh + padding * 2)

        cropped = image[y:y + bh, x:x + bw]

        return cropped