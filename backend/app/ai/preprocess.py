from PIL import Image
from transformers import AutoImageProcessor

# Load the processor once
processor = AutoImageProcessor.from_pretrained(
    "varun1505/face-characteristics"
)

def preprocess_image(image_path: str):
    """
    Reads an image and converts it into model input tensors.
    """

    image = Image.open(image_path).convert("RGB")

    inputs = processor(
        images=image,
        return_tensors="pt"
    )

    return inputs