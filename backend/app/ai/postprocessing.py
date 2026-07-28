"""Postprocessing layer — Milestone 3, Parts 4, 5 & 8.

Turns raw model scores into the structured, explainable result the UI shows:
top-1 skin type + confidence, the set of detected concerns with per-concern
severity, the single priority concern, and a plain-language explanation.

No web or DB knowledge here — pure transformation.
"""
from __future__ import annotations

# A concern is only reported if the model is at least this confident.
CONCERN_THRESHOLD = 0.45

# Clinical priority when several concerns tie on severity (higher = more urgent).
CONCERN_PRIORITY = {
    "Acne": 0.95, "Sensitive Skin": 0.92, "Redness": 0.88,
    "Hyperpigmentation": 0.80, "Dark Spots": 0.78, "Dehydrated Skin": 0.72,
    "Dryness": 0.70, "Acne Scars": 0.68, "Oiliness": 0.66, "Large Pores": 0.60,
    "Uneven Skin Tone": 0.58, "Wrinkles": 0.55, "Whiteheads": 0.52,
    "Blackheads": 0.50, "Fine Lines": 0.48,
}


def severity_from_confidence(conf: float) -> str:
    if conf >= 0.75:
        return "high"
    if conf >= 0.6:
        return "medium"
    return "low"


def finalize_skin_type(probs: dict) -> dict:
    """Top-1 skin type with confidence and the full ranked distribution."""
    ranked = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
    label, conf = ranked[0]
    return {
        "skin_type": label,
        "confidence": round(float(conf), 4),
        "distribution": [{"label": k, "probability": round(float(v), 4)} for k, v in ranked],
    }


def finalize_concerns(probs: dict) -> dict:
    """Multi-label detected concerns above threshold, ranked, with a priority pick."""
    detected = []
    for name, p in probs.items():
        if p >= CONCERN_THRESHOLD:
            detected.append({
                "name": name,
                "confidence": round(float(p), 4),
                "severity": severity_from_confidence(p),
            })

    # Rank by (severity, confidence, clinical priority)
    sev_rank = {"high": 3, "medium": 2, "low": 1}
    detected.sort(key=lambda c: (sev_rank[c["severity"]], c["confidence"],
                                 CONCERN_PRIORITY.get(c["name"], 0.5)), reverse=True)

    priority = None
    if detected:
        priority = max(detected, key=lambda c: (
            sev_rank[c["severity"]] * 0.5
            + c["confidence"] * 0.3
            + CONCERN_PRIORITY.get(c["name"], 0.5) * 0.2))["name"]

    return {
        "detected_concerns": detected,
        "priority_concern": priority,
        "all_scores": [{"name": k, "probability": round(float(v), 4)}
                       for k, v in sorted(probs.items(), key=lambda kv: kv[1], reverse=True)],
    }


def build_explanation(skin_type_result: dict, concern_result: dict,
                      features: dict, backend: str) -> str:
    """A short, honest, human-readable rationale for the prediction."""
    st = skin_type_result["skin_type"]
    conf = int(round(skin_type_result["confidence"] * 100))
    bits = [f"Detected skin type: {st} ({conf}% confidence)."]

    signals = []
    if features["shine"] > 0.12:
        signals.append("visible shine in the T-zone")
    if features["dryness"] > 0.3:
        signals.append("surface roughness consistent with dryness")
    if features["redness"] > 0.15:
        signals.append("elevated redness")
    if features["tone_variance"] > 0.2:
        signals.append("uneven tone across the face")
    if signals:
        bits.append("Key visual signals: " + ", ".join(signals) + ".")

    detected = concern_result["detected_concerns"]
    if detected:
        names = ", ".join(c["name"] for c in detected[:5])
        bits.append(f"Concerns flagged: {names}.")
        if concern_result["priority_concern"]:
            bits.append(f"Priority concern: {concern_result['priority_concern']}.")
    else:
        bits.append("No specific concerns crossed the detection threshold.")

    if backend == "heuristic":
        bits.append("(Analysis by the built-in feature model; install a trained "
                    "model to upgrade inference — see ml/README.md.)")
    return " ".join(bits)
