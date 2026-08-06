import cv2
import numpy as np


def analyze_skin(face_image):
    """
    Analyze skin characteristics from cropped face.
    Returns measurable values.
    """

    rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)

    # ---------- Brightness ----------

    gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)

    brightness = float(np.mean(gray))

    # ---------- Redness ----------

    red_channel = rgb[:, :, 0]

    green_channel = rgb[:, :, 1]

    redness = float(np.mean(red_channel) - np.mean(green_channel))

    # ---------- Texture ----------

    laplacian = cv2.Laplacian(gray, cv2.CV_64F)

    texture = float(laplacian.var())

    return {
        "brightness": brightness,
        "redness": redness,
        "texture": texture
    }