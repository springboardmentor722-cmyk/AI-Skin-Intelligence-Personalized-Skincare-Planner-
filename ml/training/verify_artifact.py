"""Real smoke check for the trained skin-lesion-screener artifact
(ml/registry/skin-lesion-screener-0.1.0/) — loads the actual saved weights and
runs inference on a handful of real ISIC images (one per class), confirming the
artifact is genuinely loadable and produces a real, well-formed prediction, not
just that the training script exited zero.

Run: `cd ml && uv run python -m training.verify_artifact`
"""

import json
from pathlib import Path

import torch
from PIL import Image
from torchvision.models import resnet18

from training.dataset import DATA_DIR, EVAL_TRANSFORM

_REGISTRY_DIR = Path(__file__).resolve().parents[1] / "registry" / "skin-lesion-screener-0.1.0"


def main() -> None:
    metadata = json.loads((_REGISTRY_DIR / "metadata.json").read_text())
    classes: list[str] = metadata["classes"]

    model = resnet18()
    model.fc = torch.nn.Linear(model.fc.in_features, len(classes))
    model.load_state_dict(torch.load(_REGISTRY_DIR / "model.pt", map_location="cpu"))
    model.eval()

    print(f"Loaded {metadata['model']}-{metadata['version']} ({len(classes)} classes)")
    print(f"Reported test macro-F1: {metadata['test_metrics']['macro_f1']:.4f}")

    for class_name in classes:
        class_dir = DATA_DIR / class_name
        sample_path = next(class_dir.glob("*.jpg"))
        image = Image.open(sample_path).convert("RGB")
        tensor = EVAL_TRANSFORM(image).unsqueeze(0)
        with torch.no_grad():
            probabilities = torch.softmax(model(tensor), dim=1)[0]
        top_index = int(probabilities.argmax())
        print(
            f"  true={class_name:5s} real_file={sample_path.name:20s} "
            f"predicted={classes[top_index]:5s} confidence={probabilities[top_index]:.3f}"
        )


if __name__ == "__main__":
    main()
