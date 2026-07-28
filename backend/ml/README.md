# Lumen AI — Skin Analysis Models

This directory documents how the computer-vision models for **AI Skin Type
Detection** and **AI Skin Concern Detection** are trained and plugged in.

## How inference works today

The app performs **real, deterministic inference** out of the box:

- **Face detection** uses OpenCV's Haar cascade (ships inside `opencv-python`, no
  download needed). Uploads with no detectable face are rejected.
- **Preprocessing** crops the face, resizes to 224×224, and normalizes to `[0,1]`.
- **Feature extraction** measures real skin signals from the image — specular
  shine, texture/roughness, redness (LAB a\*), tone variance, dark-pixel ratio.
- **Prediction** is produced by the inference layer in `app/ai/inference.py`.

The inference layer looks for trained ONNX models in `app/ai/models/`:

| File | Task | Output |
|---|---|---|
| `skin_type.onnx` | 5-class skin type | softmax over `["Normal","Dry","Oily","Combination","Sensitive"]` |
| `skin_concern.onnx` | 15-label concerns | sigmoid over the 15 concern labels (see `inference.py`) |

- **If the files are present**, they are loaded once (via `onnxruntime`) and used
  for neural-network inference. **No code change is needed** — just drop them in.
- **If absent** (the default, since weights aren't shipped in the repo), a
  transparent feature-based classifier is used. It is not random and not
  hardcoded: the same image always yields the same result, derived from the real
  measured features above. `GET /api/v1/ai/status` reports which backend is live.

## Training a real model (recommended datasets)

Both tasks use transfer learning on a lightweight backbone (MobileNetV3 or
EfficientNet-B0) so inference stays fast on CPU.

### Skin type (5 classes)
Suitable public datasets:
- Kaggle: **"Oily, Dry and Normal Skin Types Dataset"** (shaluu) — extend with
  combination/sensitive samples.
- Kaggle: **"Skin Type Classification"** variants.

Place the raw dataset under `ml/datasets/skin_type/<class>/*.jpg` and run the
training script skeleton in `ml/training/train_skin_type.py`.

### Skin concerns (15 labels, multi-label)
Suitable public datasets:
- Kaggle: **"Face Skin Diseases"**, **"Acne Grading"**, **"Skin defects — acne,
  redness, bags"** — combine and map their labels onto the 15 canonical concerns
  via `ml/training/label_map.py`.

Multi-label training uses a sigmoid head + binary cross-entropy.

### Export to ONNX
```python
# PyTorch
torch.onnx.export(model, dummy_224, "skin_type.onnx",
                  input_names=["input"], output_names=["logits"],
                  opset_version=17)

# TensorFlow / Keras
import tf2onnx
tf2onnx.convert.from_keras(model, output_path="skin_concern.onnx", opset=17)
```

Copy the resulting `.onnx` files into `backend/app/ai/models/` and restart the
backend. `GET /api/v1/ai/status` will then report `"onnx"`.

## Label contracts (must match exactly)

```python
SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"]

SKIN_CONCERNS = [
    "Acne", "Acne Scars", "Hyperpigmentation", "Dark Spots", "Wrinkles",
    "Fine Lines", "Oiliness", "Dryness", "Large Pores", "Redness",
    "Blackheads", "Whiteheads", "Uneven Skin Tone", "Sensitive Skin",
    "Dehydrated Skin",
]
```

A model whose output length doesn't match its label list is ignored and the app
falls back to the feature model, so a mismatched export can never crash inference.

## Layer separation (Part 6)

```
app/ai/preprocessing.py   image bytes -> face crop -> tensor + features
app/ai/inference.py       tensor/features -> raw scores   (ONNX or heuristic)
app/ai/postprocessing.py  raw scores -> severity, priority, explanation
app/routers/ai.py         HTTP + JWT + persistence
```

Swapping models touches only the two `.onnx` files. Swapping the *runtime*
(e.g. to TensorFlow serving) touches only `inference.py`.
