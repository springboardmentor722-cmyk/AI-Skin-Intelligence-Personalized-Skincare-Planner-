from ultralytics import YOLO

# Temporary model
model = YOLO("yolov8n.pt")


def detect_acne(face_image):

    """
    Temporary acne detector.

    Returns acne severity score.
    """

    results = model.predict(
        source=face_image,
        verbose=False
    )

    detections = len(results[0].boxes)

    acne_score = min(detections * 10, 100)

    return acne_score