"""Skin-type classifier — training + ONNX export skeleton (Milestone 3, Part 6).

This is a runnable reference recipe. It is intentionally framework-light and does
NOT execute during the app; it exists so a real model can be produced and dropped
into app/ai/models/skin_type.onnx without touching application code.

Usage:
    1. Put images under ml/datasets/skin_type/<class>/*.jpg
       classes: Normal, Dry, Oily, Combination, Sensitive
    2. pip install torch torchvision onnx
    3. python ml/training/train_skin_type.py
    4. cp skin_type.onnx ../app/ai/models/

See ml/README.md for dataset sources.
"""
from __future__ import annotations

import os

LABELS = ["Normal", "Dry", "Oily", "Combination", "Sensitive"]
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets", "skin_type")
INPUT_SIZE = 224
OUT = "skin_type.onnx"


def train_and_export() -> None:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import datasets, models, transforms

    tfm = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),   # -> [0,1], matching preprocessing.normalize()
    ])
    ds = datasets.ImageFolder(DATA_DIR, transform=tfm)
    # ImageFolder sorts classes alphabetically; remap to our fixed LABELS order.
    dl = DataLoader(ds, batch_size=32, shuffle=True, num_workers=2)

    model = models.mobilenet_v3_small(weights="DEFAULT")
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, len(LABELS))

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-4)
    loss_fn = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(10):
        total = 0.0
        for x, y in dl:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss = loss_fn(model(x), y)
            loss.backward()
            opt.step()
            total += loss.item()
        print(f"epoch {epoch+1}: loss {total/len(dl):.4f}")

    model.eval()
    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE, device=device)
    torch.onnx.export(model, dummy, OUT, input_names=["input"],
                      output_names=["logits"], opset_version=17,
                      dynamic_axes={"input": {0: "batch"}})
    print(f"Exported {OUT}. Copy it to app/ai/models/ and restart the backend.")


if __name__ == "__main__":
    if not os.path.isdir(DATA_DIR):
        raise SystemExit(f"Dataset not found at {DATA_DIR}. See ml/README.md.")
    train_and_export()
