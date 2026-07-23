"""Screenshot reverse-engineering primitives.

Three channels, cross-checked:
  * programmatic pixel/geometry analysis  -> exact values   (this module)
  * OCR with bounding boxes               -> verbatim text  (this module)
  * native model vision on upscaled crops -> meaning        (the agent, via `crop`)

Nothing here decides what a thing *is*. It measures. Meaning comes from reading
the crops. Calibrated against the Skinlytics milestone-2 role dashboards.
"""

from __future__ import annotations

import json
import os
from collections import Counter
from dataclasses import dataclass, asdict
from typing import Iterable, Sequence

import cv2
import numpy as np
from PIL import Image

try:
    import pytesseract

    _HAS_TESSERACT = True
except Exception:  # pragma: no cover
    _HAS_TESSERACT = False


# ---------------------------------------------------------------- helpers


def load_rgb(path: str) -> Image.Image:
    return Image.open(path).convert("RGB")


def to_hex(rgb: Sequence[int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))


def write_json(obj, path: str) -> str:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh, indent=2)
    return path


# ---------------------------------------------------------------- probe


def probe(path: str, css_width: float = 1440.0, top: int = 8) -> dict:
    im = load_rgb(path)
    w, h = im.size
    arr = np.asarray(im).reshape(-1, 3)
    counts = Counter(map(tuple, arr))
    total = arr.shape[0]
    dominant = [
        {"hex": to_hex(c), "rgb": list(c), "coverage_pct": round(100 * n / total, 3)}
        for c, n in counts.most_common(top)
    ]
    scale = w / css_width
    return {
        "path": path,
        "width_px": w,
        "height_px": h,
        "assumed_css_width": css_width,
        "scale_factor": round(scale, 4),
        "css_size": [round(w / scale, 1), round(h / scale, 1)],
        "dominant_colors": dominant,
    }


# ---------------------------------------------------------------- sample


def sample(path: str, points: Iterable[tuple[int, int]], box: int = 5) -> list[dict]:
    """Modal colour of a small box around each point.

    Single-pixel reads are unreliable on lossy captures: a flat violet fill in
    these screenshots varies by up to +/-8 units between adjacent pixels. Take
    the mode of a patch, never `getpixel`.
    """
    arr = np.asarray(load_rgb(path))
    h, w, _ = arr.shape
    r = max(0, box // 2)
    out = []
    for x, y in points:
        x, y = int(x), int(y)
        if not (0 <= x < w and 0 <= y < h):
            out.append({"x": x, "y": y, "error": "out of bounds"})
            continue
        patch = arr[max(0, y - r) : y + r + 1, max(0, x - r) : x + r + 1].reshape(-1, 3)
        mode = Counter(map(tuple, patch)).most_common(1)[0][0]
        med = np.median(patch, axis=0)
        out.append(
            {
                "x": x,
                "y": y,
                "hex": to_hex(mode),
                "median_hex": to_hex(med),
                "spread": int(np.abs(patch.astype(np.int16) - np.array(mode)).max()),
            }
        )
    return out


# ---------------------------------------------------------------- palette


def palette(path: str, k: int = 12, max_side: int = 600, min_coverage: float = 0.12) -> list[dict]:
    from sklearn.cluster import KMeans

    im = load_rgb(path)
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    arr = np.asarray(im).reshape(-1, 3).astype(np.float32)
    k = min(k, len(np.unique(arr, axis=0)))
    km = KMeans(n_clusters=k, n_init=4, random_state=0).fit(arr)
    labels, centers = km.labels_, km.cluster_centers_
    total = len(labels)
    rows = []
    for i, c in enumerate(centers):
        pct = 100 * int((labels == i).sum()) / total
        if pct >= min_coverage:
            rows.append(
                {"hex": to_hex(c), "rgb": [int(v) for v in c], "coverage_pct": round(pct, 2)}
            )
    return sorted(rows, key=lambda r: -r["coverage_pct"])


def accent_palette(path: str, k: int = 18, min_chroma: int = 25) -> list[dict]:
    """Palette with neutrals dropped — the brand colours, not the canvas."""
    out = []
    for r in palette(path, k=k):
        red, g, b = r["rgb"]
        if max(red, g, b) - min(red, g, b) >= min_chroma:
            out.append(r)
    return out


# ---------------------------------------------------------------- geometry


def _canvas_color(arr: np.ndarray, margin_frac: float = 0.02) -> np.ndarray:
    """Modal colour of the outer right/top margin — reliably the page canvas."""
    h, w, _ = arr.shape
    m = max(4, int(w * margin_frac))
    strip = np.concatenate(
        [arr[:, w - m :].reshape(-1, 3), arr[: max(4, int(h * margin_frac))].reshape(-1, 3)]
    )
    return np.array(Counter(map(tuple, strip)).most_common(1)[0][0], dtype=np.int16)


def _card_color(arr: np.ndarray) -> np.ndarray:
    """Modal near-white neutral colour — the card surface."""
    a = arr.astype(np.int16)
    m = (a.min(axis=2) >= 248) & ((a.max(axis=2) - a.min(axis=2)) <= 2)
    px = arr[m]
    if len(px) == 0:
        return np.array([255, 255, 255], dtype=np.int16)
    return np.array(Counter(map(tuple, px)).most_common(1)[0][0], dtype=np.int16)


def _canvas_mask(arr: np.ndarray, canvas: np.ndarray, card: np.ndarray) -> np.ndarray:
    """Classify each pixel canvas-or-card by nearest colour, not by a threshold.

    Canvas (#F9F9FE) and card (#FEFEFE) differ by ~5 units per channel here,
    inside the noise floor of these captures, and each of the four screenshots
    uses a slightly different canvas tint. Any absolute threshold that works on
    one fails on the next. Nearest-centroid assignment self-calibrates per image.
    """
    a = arr.astype(np.int32)
    d_canvas = ((a - canvas.astype(np.int32)) ** 2).sum(axis=2)
    d_card = ((a - card.astype(np.int32)) ** 2).sum(axis=2)
    return (d_canvas < d_card) & (a.min(axis=2) >= 200)


def sidebar_edge(arr: np.ndarray, lo_frac: float = 0.05, hi_frac: float = 0.32,
                 grad_min: float = 6.0) -> dict:
    """Sidebar divider = the most *consistent* full-height vertical edge.

    Summed gradient energy does not find it: a column of nav icons outscores a
    1px divider every time. What identifies a divider is that its edge exists on
    nearly every row, so score columns by the FRACTION of rows carrying a strong
    gradient and take the argmax. A true divider scores ~1.0.
    """
    g = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY).astype(np.float32)
    sx = np.abs(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3))
    frac = (sx > grad_min).mean(axis=0)
    w = arr.shape[1]
    lo, hi = int(lo_frac * w), int(hi_frac * w)
    idx = int(np.argmax(frac[lo:hi])) + lo
    return {"x": idx, "consistency": round(float(frac[idx]), 3)}


def _runs(mask: np.ndarray, min_len: int) -> list[tuple[int, int]]:
    runs, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start, i - start))
            start = None
    if start is not None:
        runs.append((start, len(mask) - start))
    return [r for r in runs if r[1] >= min_len]


def _complement(runs, total: int, min_len: int):
    out, cursor = [], 0
    for s, n in runs:
        if s - cursor >= min_len:
            out.append((cursor, s - cursor))
        cursor = s + n
    if total - cursor >= min_len:
        out.append((cursor, total - cursor))
    return out


def grid(path: str, purity: float = 0.90, min_gutter: int = 6, min_band: int = 40,
         scale: float | None = None) -> dict:
    """Recover layout structure with two-pass projection profiles.

    Pass 0 finds the sidebar divider. Pass 1 finds row bands in the content
    area. Pass 2 finds each row's columns by profiling *within that row band*.

    One global column profile cannot work on a real dashboard: the gutter
    between two row-1 cards is covered by a card in row 3, so it never reads as
    canvas over the full image height. Per-row-band profiling is what makes the
    column spans come out right.

    Tune `purity` (0.85-0.95) and `min_gutter` when a row under-segments, and
    always confirm the result against the screenshot with vision.
    """
    arr = np.asarray(load_rgb(path))
    h, w, _ = arr.shape
    canvas, card = _canvas_color(arr), _card_color(arr)
    separation = int(np.abs(canvas.astype(np.int16) - card).max())
    is_canvas = _canvas_mask(arr, canvas, card)

    edge = sidebar_edge(arr)
    x0 = edge["x"]
    content = is_canvas[:, x0:]

    row_gutters = _runs(content.mean(axis=1) >= purity, min_gutter)
    row_bands = _complement(row_gutters, h, min_band)

    rows_out, all_gutters = [], []
    for idx, (y, bh) in enumerate(row_bands):
        band = content[y : y + bh]
        gutters = _runs(band.mean(axis=0) >= purity, min_gutter)
        cards = _complement(gutters, band.shape[1], min_band)
        inner = [n for s, n in gutters if s > 0 and s + n < band.shape[1]]
        all_gutters.extend(inner)
        rows_out.append(
            {
                "row": idx,
                "y": int(y),
                "h": int(bh),
                "card_count": len(cards),
                "cards": [{"x": int(x0 + cx), "w": int(cw)} for cx, cw in cards],
                "gutters_px": inner,
            }
        )

    gutter_px = int(np.median(all_gutters)) if all_gutters else None
    out = {
        "path": path,
        "image_size": [w, h],
        "canvas_hex": to_hex(canvas),
        "card_hex": to_hex(card),
        "canvas_card_separation": separation,
        "separation_warning": (
            "canvas and card differ by <=4 units — segmentation sits on the noise "
            "floor; verify every row and column against the screenshot with vision"
            if separation <= 4
            else None
        ),
        "sidebar_edge_px": x0,
        "sidebar_edge_consistency": edge["consistency"],
        "median_gutter_px": gutter_px,
        "row_count": len(rows_out),
        "rows": rows_out,
    }
    if scale:
        out["scale"] = scale
        out["css"] = {
            "sidebar_width": round(x0 / scale),
            "gutter": round(gutter_px / scale) if gutter_px else None,
            "rows": [
                {
                    "row": r["row"],
                    "y": round(r["y"] / scale),
                    "h": round(r["h"] / scale),
                    "card_count": r["card_count"],
                    "cards": [
                        {"x": round(c["x"] / scale), "w": round(c["w"] / scale)}
                        for c in r["cards"]
                    ],
                }
                for r in rows_out
            ],
        }
    return out


# ---------------------------------------------------------------- ocr

# glyphs and strings OCR mangles on this design system — always vision-confirm
SUSPECT_TOKENS = ("₹", "Rs", "%", "/", "✓", "→", "↑", "↓", "•", "▾", "›", "⋮", "✨")


def ocr(path: str, upscale: int = 3, psm: int = 6, min_conf: int = 40,
        region: tuple[int, int, int, int] | None = None) -> dict:
    """Word-level OCR with bounding boxes, grouped into lines.

    Coordinates are returned in ORIGINAL image space, not upscaled space.
    Lines are flagged `suspect` when they contain a known-problem glyph or any
    word below 70 confidence — read those with vision before trusting them.
    """
    if not _HAS_TESSERACT:
        return {"error": "pytesseract/tesseract unavailable", "lines": [], "words": []}

    im = load_rgb(path)
    ox = oy = 0
    if region:
        ox, oy, rw, rh = region
        im = im.crop((ox, oy, ox + rw, oy + rh))
    if upscale > 1:
        im = im.resize((im.width * upscale, im.height * upscale), Image.LANCZOS)

    data = pytesseract.image_to_data(im, config=f"--psm {psm}",
                                     output_type=pytesseract.Output.DICT)

    words, lines = [], {}
    for i, text in enumerate(data["text"]):
        text = text.strip()
        conf = float(data["conf"][i])
        if not text or conf < min_conf:
            continue
        wd = {
            "text": text,
            "conf": round(conf, 1),
            "x": int(data["left"][i] / upscale) + ox,
            "y": int(data["top"][i] / upscale) + oy,
            "w": int(data["width"][i] / upscale),
            "h": int(data["height"][i] / upscale),
        }
        words.append(wd)
        lines.setdefault(
            (data["block_num"][i], data["par_num"][i], data["line_num"][i]), []
        ).append(wd)

    line_rows = []
    for group in lines.values():
        group.sort(key=lambda g: g["x"])
        text = " ".join(g["text"] for g in group)
        cmin = min(g["conf"] for g in group)
        line_rows.append(
            {
                "text": text,
                "x": min(g["x"] for g in group),
                "y": min(g["y"] for g in group),
                "conf_min": cmin,
                "conf_mean": round(sum(g["conf"] for g in group) / len(group), 1),
                "suspect": cmin < 70 or any(t in text for t in SUSPECT_TOKENS),
            }
        )
    line_rows.sort(key=lambda r: (r["y"], r["x"]))

    return {
        "path": path,
        "upscale": upscale,
        "psm": psm,
        "word_count": len(words),
        "line_count": len(line_rows),
        "suspect_line_count": sum(1 for r in line_rows if r["suspect"]),
        "lines": line_rows,
        "words": words,
    }


def string_set(result: dict, min_len: int = 2) -> set[str]:
    out = set()
    for line in result.get("lines", []):
        t = " ".join(line["text"].split()).strip(" .,:").lower()
        if len(t) >= min_len:
            out.add(t)
    return out


def compare_strings(source: dict, build: dict) -> dict:
    a, b = string_set(source), string_set(build)
    return {
        "source_count": len(a),
        "build_count": len(b),
        "matched": len(a & b),
        "coverage_pct": round(100 * len(a & b) / max(1, len(a)), 1),
        "missing_in_build": sorted(a - b),
        "added_in_build": sorted(b - a),
    }


# ---------------------------------------------------------------- diff / crop


def _edge_map(im: Image.Image, lo: int = 60, hi: int = 160, dilate: int = 2) -> np.ndarray:
    g = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2GRAY)
    e = cv2.Canny(g, lo, hi)
    if dilate:
        k = cv2.getStructuringElement(cv2.MORPH_RECT, (dilate * 2 + 1, dilate * 2 + 1))
        e = cv2.dilate(e, k)
    return e > 0


def structural_diff(path_a: str, path_b: str, dilate: int = 2,
                    ignore: Sequence[tuple[int, int, int, int]] = (),
                    out_path: str | None = None) -> dict:
    """Colour-invariant layout comparison via dilated edge maps.

    Use this when the build deliberately uses a different palette from the design
    screenshot — a straight RGB diff would report ~100% mismatch on every filled
    element and the fidelity loop could never converge. Edges survive a palette
    change; boxes, text runs, and chart outlines do not move.

    Reports IoU of the two edge maps plus one-sided misses, so you can tell
    "the build is missing structure" from "the build has extra structure".
    Dilation absorbs sub-pixel and 1-2px layout shifts; raise it for a noisier
    comparison, lower it for a stricter one.
    """
    a, b = load_rgb(path_a), load_rgb(path_b)
    if a.size != b.size:
        b = b.resize(a.size, Image.LANCZOS)

    ea, eb = _edge_map(a, dilate=dilate), _edge_map(b, dilate=dilate)

    mask = np.ones(ea.shape, dtype=bool)
    for x, y, w, h in ignore:
        mask[y : y + h, x : x + w] = False
    ea, eb = ea & mask, eb & mask

    inter = int((ea & eb).sum())
    union = int((ea | eb).sum())
    iou = round(100 * inter / max(1, union), 2)

    if out_path:
        vis = np.zeros((*ea.shape, 3), dtype=np.uint8)
        vis[ea & ~eb] = [255, 60, 60]     # in design, missing from build
        vis[eb & ~ea] = [60, 140, 255]    # in build, not in design
        vis[ea & eb] = [40, 40, 40]       # agreed structure
        os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
        Image.fromarray(vis).save(out_path)

    return {
        "a": path_a,
        "b": path_b,
        "mode": "structural",
        "dilate": dilate,
        "edge_iou_pct": iou,
        "structure_mismatch_pct": round(100 - iou, 2),
        "missing_from_build_px": int((ea & ~eb).sum()),
        "extra_in_build_px": int((eb & ~ea).sum()),
        "diff_image": out_path,
    }


def diff(path_a: str, path_b: str, threshold: int = 24,
         ignore: Sequence[tuple[int, int, int, int]] = (), out_path: str | None = None) -> dict:
    a, b = load_rgb(path_a), load_rgb(path_b)
    if a.size != b.size:
        b = b.resize(a.size, Image.LANCZOS)
    delta = np.abs(np.asarray(a).astype(np.int16) - np.asarray(b).astype(np.int16)).max(axis=2)

    mask = np.ones(delta.shape, dtype=bool)
    for x, y, w, h in ignore:
        mask[y : y + h, x : x + w] = False

    considered = int(mask.sum())
    mismatched = int(((delta > threshold) & mask).sum())

    if out_path:
        vis = np.asarray(b).copy()
        vis[(delta > threshold) & mask] = [255, 0, 128]
        os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
        Image.fromarray(vis).save(out_path)

    return {
        "a": path_a,
        "b": path_b,
        "threshold": threshold,
        "pixels_considered": considered,
        "pixels_mismatched": mismatched,
        "mismatch_pct": round(100 * mismatched / max(1, considered), 3),
        "diff_image": out_path,
    }


def crop(path: str, box: tuple[int, int, int, int], scale: int = 3, out_path: str = "") -> str:
    im = load_rgb(path)
    x, y, w, h = box
    piece = im.crop((x, y, x + w, y + h))
    if scale > 1:
        piece = piece.resize((piece.width * scale, piece.height * scale), Image.LANCZOS)
    if not out_path:
        base = os.path.splitext(os.path.basename(path))[0]
        out_path = f"{base}-{x}_{y}_{w}_{h}@{scale}x.png"
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    piece.save(out_path)
    return out_path
