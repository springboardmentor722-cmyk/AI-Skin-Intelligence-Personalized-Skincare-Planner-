"""Real transfer-learning training run for a skin-lesion screener, on the real,
fully-downloaded ISIC 2019 dataset (training_dataset/raw/isic-2019/,
training_dataset/MANIFEST.md #3) — no synthetic data, no fabricated labels
(AGENTS.md §0.2).

READ BEFORE WIRING THIS INTO ANY USER-FACING SURFACE:

1. **This is a lesion/condition classifier, not the app's cosmetic "Concern
   Detector."** ISIC 2019's 8 classes (AK, BCC, BKL, DF, MEL, NV, SCC, VASC)
   are dermatological diagnostic categories (actinic keratosis, basal cell
   carcinoma, melanoma, ...), not the `skin_concerns` taxonomy this app's
   product/routine surfaces use (acne, hyperpigmentation, oiliness, ...).
   Training "the Concern Detector" on this data would silently mislabel a
   cancer-screening tool as a cosmetic one — a real, confirmed dataset-task
   mismatch (flagged and confirmed with the project owner, PROGRESS.md
   2026-07-23), not something this script papers over. It's positioned as a
   dermatologist-facing condition-report aid (the Dermatologist role's
   "Condition Reports" nav item, ARCHITECTURE.md §2 — not yet built) and
   nothing else.
2. **Fairness gap, documented not silently worked around.** docs/AI_ML.md's
   fairness requirement is explicit and "non-negotiable for a skin product":
   image models are evaluated across Fitzpatrick I-VI / Monk 10-tone balanced
   slices before release, with a >5pp per-tone gap blocking it. ISIC 2019's own
   metadata (training_dataset/raw/isic-2019/ISIC_2019_Training_Metadata.csv)
   has no skin-tone field — only age/sex/anatomical site. This model CANNOT be
   evaluated against that requirement with the data actually available, and
   must not be treated as release-ready (i.e. never wired into any endpoint a
   real user or dermatologist reaches) until real tone-annotated data exists.
   Trained here as a real, working, honestly-limited artifact, not fabricated
   compliance with a requirement this dataset can't support.
3. **No medical-diagnosis framing anywhere this touches the product**: any
   future UI surfacing this model's output carries the same "not medical
   advice" disclaimer every AI-derived surface in this app already does
   (AGENTS.md §2 rule 8), and every confidence value must be shown, never
   hidden — this project's `docs/AI_ML.md` model-card discipline, applied here
   even though this artifact isn't wired into any endpoint yet.

Run: `cd ml && uv run python -m training.train_lesion_classifier`
"""

import datetime
import json
import subprocess
import time
from pathlib import Path

import torch
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from torch import nn
from torch.utils.data import DataLoader
from torchvision.models import ResNet18_Weights, resnet18

from training.dataset import build_splits, class_counts

_REGISTRY_DIR = Path(__file__).resolve().parents[1] / "registry" / "skin-lesion-screener-0.1.0"
_BATCH_SIZE = 64
_EPOCHS = 4
_LEARNING_RATE = 3e-4


def _build_model(num_classes: int) -> nn.Module:
    """Partial fine-tune (backbone frozen except layer4 + fc) — keeps this
    trainable in a real amount of time on CPU while still adapting the
    ImageNet-pretrained features to lesion images, not just a linear probe on
    raw ImageNet features."""
    model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
    for param in model.parameters():
        param.requires_grad = False
    for param in model.layer4.parameters():
        param.requires_grad = True
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def _git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=Path(__file__).resolve().parents[2]
        ).decode().strip()
    except Exception:
        return "unknown"


def main() -> None:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on {device}")

    train_set, val_set, test_set, classes = build_splits()
    print(f"Splits: train={len(train_set)} val={len(val_set)} test={len(test_set)}")

    counts = class_counts(classes, train_set)
    print("Real training-split class counts:", counts)
    # Inverse-frequency weights — the real class imbalance (DF: 239 vs NV:
    # 12,875 in the full set) means an unweighted loss would just learn to
    # always predict NV.
    total = sum(counts.values())
    weights = torch.tensor(
        [total / (len(classes) * max(counts[c], 1)) for c in classes], dtype=torch.float32
    )

    train_loader = DataLoader(train_set, batch_size=_BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_set, batch_size=_BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=_BATCH_SIZE, shuffle=False, num_workers=0)

    model = _build_model(len(classes)).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights.to(device))
    optimizer = torch.optim.Adam(
        [p for p in model.parameters() if p.requires_grad], lr=_LEARNING_RATE
    )

    history = []
    for epoch in range(1, _EPOCHS + 1):
        model.train()
        started = time.monotonic()
        running_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)
        train_loss = running_loss / len(train_set)

        model.eval()
        val_correct = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                preds = model(images).argmax(dim=1)
                val_correct += (preds == labels).sum().item()
        val_accuracy = val_correct / len(val_set)
        elapsed = time.monotonic() - started
        print(
            f"Epoch {epoch}/{_EPOCHS}: train_loss={train_loss:.4f} "
            f"val_accuracy={val_accuracy:.4f} ({elapsed:.0f}s)"
        )
        history.append({"epoch": epoch, "train_loss": train_loss, "val_accuracy": val_accuracy})

    # Final held-out test evaluation — the real metric this model card reports.
    model.eval()
    all_preds: list[int] = []
    all_labels: list[int] = []
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            preds = model(images).argmax(dim=1).cpu()
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.tolist())

    macro_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    report = classification_report(
        all_labels, all_preds, target_names=classes, zero_division=0, output_dict=True
    )
    matrix = confusion_matrix(all_labels, all_preds).tolist()

    _REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), _REGISTRY_DIR / "model.pt")

    metadata = {
        "model": "skin-lesion-screener",
        "version": "0.1.0",
        "trained_at": datetime.datetime.now(datetime.UTC).isoformat(),
        "git_commit": _git_commit(),
        "architecture": "resnet18 (ImageNet-pretrained, layer4+fc fine-tuned)",
        "classes": classes,
        "dataset": {
            "source": "Kaggle salviohexia/isic-2019-skin-lesion-images-for-classification",
            "manifest_ref": "training_dataset/MANIFEST.md #3",
            "train_size": len(train_set),
            "val_size": len(val_set),
            "test_size": len(test_set),
            "train_class_counts": counts,
        },
        "training": {"epochs": _EPOCHS, "batch_size": _BATCH_SIZE, "lr": _LEARNING_RATE},
        "history": history,
        "test_metrics": {
            "macro_f1": macro_f1,
            "per_class_report": report,
            "confusion_matrix": matrix,
        },
        "intended_use": (
            "Dermatologist-facing condition-report aid (ARCHITECTURE.md's "
            "Dermatologist role, 'Condition Reports' — not yet built). NOT the "
            "app's consumer 'Concern Detector'/'Skin Type Classifier' — those "
            "operate over the cosmetic skin_concerns taxonomy, a different label "
            "space than this model's lesion-diagnosis classes."
        ),
        "fairness_gap": (
            "NOT evaluated against docs/AI_ML.md's non-negotiable Fitzpatrick/"
            "Monk tone-balanced-slice requirement — the source dataset's own "
            "metadata (ISIC_2019_Training_Metadata.csv) has no skin-tone field. "
            "Must not be treated as release-ready until real tone-annotated "
            "data exists."
        ),
        "medical_disclaimer": (
            "Advisory only, never a diagnosis — any UI surfacing this model's "
            "output must carry the same 'not medical advice' disclaimer every "
            "AI-derived surface in this app already does (AGENTS.md §2 rule 8)."
        ),
    }
    (_REGISTRY_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))

    print(f"\nTest macro-F1: {macro_f1:.4f}")
    print(f"Model + metadata written to {_REGISTRY_DIR}")


if __name__ == "__main__":
    main()
