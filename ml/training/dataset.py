"""Real, downloaded ISIC 2019 images only (training_dataset/raw/isic-2019/,
training_dataset/MANIFEST.md #3) — no synthetic/fabricated samples. Images are
already sorted into one folder per diagnostic class (AK/BCC/BKL/DF/MEL/NV/SCC/
VASC — the real ISIC 2019 taxonomy), a standard `ImageFolder` layout.
"""

from pathlib import Path

import torch
from torch.utils.data import Subset
from torchvision import datasets, transforms

DATA_DIR = Path(__file__).resolve().parents[2] / "training_dataset" / "raw" / "isic-2019"

IMAGE_SIZE = 128
_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD = [0.229, 0.224, 0.225]

TRAIN_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),  # lesion photos have no fixed "up" orientation
        transforms.ToTensor(),
        transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
    ]
)
EVAL_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=_IMAGENET_MEAN, std=_IMAGENET_STD),
    ]
)


def build_splits(
    val_fraction: float = 0.15, test_fraction: float = 0.15, seed: int = 42
) -> tuple[Subset, Subset, Subset, list[str]]:
    """Stratified-by-construction only in expectation (a plain random split, not a
    per-class stratified one) — real class imbalance (DF: 239 images vs NV:
    12,875) means a small test split can still under-represent the rarest
    classes; documented as-is in the model card rather than silently balanced
    away with synthetic oversampling."""
    base = datasets.ImageFolder(str(DATA_DIR))
    n = len(base)
    n_test = int(n * test_fraction)
    n_val = int(n * val_fraction)
    n_train = n - n_val - n_test

    generator = torch.Generator().manual_seed(seed)
    # torch's stub types random_split's first arg as Dataset[T] — range() satisfies
    # it at runtime (real, documented usage: split index positions, not samples
    # themselves) but isn't a nominal Dataset subclass, a stub imprecision, not a
    # real type error.
    splits: list[Subset[int]] = torch.utils.data.random_split(
        range(n),  # type: ignore[arg-type]
        [n_train, n_val, n_test],
        generator=generator,
    )
    train_idx, val_idx, test_idx = splits

    train_folder = datasets.ImageFolder(str(DATA_DIR), transform=TRAIN_TRANSFORM)
    eval_folder = datasets.ImageFolder(str(DATA_DIR), transform=EVAL_TRANSFORM)
    train_set = Subset(train_folder, train_idx.indices)
    val_set = Subset(eval_folder, val_idx.indices)
    test_set = Subset(eval_folder, test_idx.indices)
    return train_set, val_set, test_set, base.classes


def class_counts(base_classes: list[str], subset: Subset) -> dict[str, int]:
    """Reads `ImageFolder.targets` directly (no image decode) — counting via
    `subset[i]` would load and transform every real image just to discard it."""
    targets = subset.dataset.targets  # type: ignore[attr-defined]
    counts = dict.fromkeys(base_classes, 0)
    for index in subset.indices:
        counts[base_classes[targets[index]]] += 1
    return counts
