"""Skin Assessment Engine — Milestone 2, Step 2.

Deterministic, rule-based concern extraction and prioritisation. A rule engine is
used deliberately in place of a *trained* scikit-learn classifier: with no labelled
clinical dataset available at this milestone, a fitted model would be guesswork
dressed up as science. The weight maps below are explicit, auditable and reviewable
by a dermatologist — which is what a health product actually needs.

scikit-learn is used for the part of the problem it genuinely fits: normalising the
severity signals onto a common scale (MinMaxScaler) so concerns raised through
different inputs can be ranked against each other fairly.
"""
from __future__ import annotations

import numpy as np
from sklearn.preprocessing import MinMaxScaler

# ---------------------------------------------------------------------------
# The concern catalogue.
#   base_weight — clinical priority when severity is equal
#   keywords    — how the concern is recognised in the user's own words
# ---------------------------------------------------------------------------
CONCERN_CATALOGUE: dict[str, dict] = {
    "Acne":              {"base_weight": 0.95, "keywords": ["acne", "pimple", "breakout", "zit", "blemish", "whitehead", "blackhead"]},
    "Sensitive Skin":    {"base_weight": 0.90, "keywords": ["sensitive", "sensitivity", "reactive", "stinging", "burning"]},
    "Redness":           {"base_weight": 0.85, "keywords": ["redness", "rosacea", "flushing", "inflamed", "irritation"]},
    "Hyperpigmentation": {"base_weight": 0.75, "keywords": ["hyperpigmentation", "pigmentation", "melasma", "uneven tone", "discoloration"]},
    "Dark Spots":        {"base_weight": 0.70, "keywords": ["dark spot", "sun spot", "age spot", "post-inflammatory", "marks"]},
    "Dry Skin":          {"base_weight": 0.68, "keywords": ["dry", "dryness", "flaky", "flaking", "tight", "dehydrated", "rough"]},
    "Oiliness":          {"base_weight": 0.65, "keywords": ["oily", "oiliness", "greasy", "shine", "shiny", "sebum"]},
    "Wrinkles":          {"base_weight": 0.60, "keywords": ["wrinkle", "deep lines", "sagging", "aging", "ageing"]},
    "Fine Lines":        {"base_weight": 0.55, "keywords": ["fine line", "crow", "expression lines"]},
}

# Words in the user's own description that escalate or de-escalate severity
HIGH_SEVERITY_MARKERS = ["severe", "active", "flare", "flare-up", "flareup", "painful",
                         "cystic", "constant", "chronic", "worsening", "extreme"]
MEDIUM_SEVERITY_MARKERS = ["moderate", "occasional", "sometimes", "recurring"]
LOW_SEVERITY_MARKERS = ["mild", "slight", "minor", "rare", "barely"]

SEVERITY_RANK = {"high": 3, "medium": 2, "low": 1}


def _severity_from_text(text: str) -> str | None:
    """Read an explicit severity cue out of the user's wording."""
    t = text.lower()
    if any(m in t for m in HIGH_SEVERITY_MARKERS):
        return "high"
    if any(m in t for m in MEDIUM_SEVERITY_MARKERS):
        return "medium"
    if any(m in t for m in LOW_SEVERITY_MARKERS):
        return "low"
    return None


def identify_skin_concerns(profile_data: dict) -> list[dict]:
    """Scan a user's profile and return their concerns, ranked most-severe first.

    Accepts (all optional):
        concerns            free text or comma list, e.g. "active acne, mild dryness"
        concern_severities  explicit map, e.g. {"Acne": "high"} — wins over text
        skin_type           oily / dry / combination / sensitive / normal
        sensitivities       free text; any content implies Sensitive Skin
        age                 surfaces age-appropriate ageing concerns

    Returns [{"name","severity","weight","source"}, ...]; element 0 is PRIMARY.
    """
    raw_text = " ".join(str(profile_data.get(k) or "") for k in
                        ("concerns", "sensitivities", "notes", "goals")).lower()
    explicit: dict[str, str] = {
        str(k).strip().title(): str(v).strip().lower()
        for k, v in (profile_data.get("concern_severities") or {}).items()
    }
    skin_type = str(profile_data.get("skin_type") or "").strip().lower()
    age = profile_data.get("age")

    found: dict[str, dict] = {}

    # --- 1. Match the catalogue against what the user actually reported -----
    for name, meta in CONCERN_CATALOGUE.items():
        matched_kw = next((kw for kw in meta["keywords"] if kw in raw_text), None)
        severity = explicit.get(name)

        if severity is None and matched_kw:
            # Look for a severity cue in the words surrounding the match
            idx = raw_text.find(matched_kw)
            window = raw_text[max(0, idx - 40): idx + len(matched_kw) + 40]
            severity = _severity_from_text(window) or "medium"

        if severity in ("high", "medium", "low"):
            found[name] = {
                "name": name,
                "severity": severity,
                "base_weight": meta["base_weight"],
                "source": "reported" if matched_kw else "declared",
            }

    # --- 2. Skin type implies a baseline concern ---------------------------
    implied = {"oily": ("Oiliness", "medium"),
               "dry": ("Dry Skin", "medium"),
               "sensitive": ("Sensitive Skin", "high")}
    if skin_type in implied:
        name, sev = implied[skin_type]
        if name not in found:
            found[name] = {"name": name, "severity": sev,
                           "base_weight": CONCERN_CATALOGUE[name]["base_weight"],
                           "source": "skin_type"}

    # A declared sensitivity always counts, and always counts as serious.
    if str(profile_data.get("sensitivities") or "").strip():
        found.setdefault("Sensitive Skin", {
            "name": "Sensitive Skin", "severity": "high",
            "base_weight": CONCERN_CATALOGUE["Sensitive Skin"]["base_weight"],
            "source": "sensitivities"})

    # --- 3. Age-appropriate ageing concerns --------------------------------
    if isinstance(age, (int, float)) and age >= 35 \
            and "Wrinkles" not in found and "Fine Lines" not in found:
        found["Fine Lines"] = {"name": "Fine Lines", "severity": "low",
                               "base_weight": CONCERN_CATALOGUE["Fine Lines"]["base_weight"],
                               "source": "age"}

    if not found:
        return []

    # --- 4. Rank: severity dominates, clinical weight breaks ties ----------
    # MinMaxScaler puts both signals on the same 0-1 scale, so neither dominates
    # merely because of its natural units.
    items = list(found.values())
    signals = np.array([[SEVERITY_RANK[i["severity"]], i["base_weight"]] for i in items], dtype=float)
    scaled = MinMaxScaler().fit_transform(signals) if len(items) > 1 else np.array([[1.0, 1.0]])

    priority = scaled[:, 0] * 0.7 + scaled[:, 1] * 0.3

    for item, p in zip(items, priority):
        item["weight"] = round(float(p), 4)
        item.pop("base_weight", None)

    items.sort(key=lambda i: (SEVERITY_RANK[i["severity"]], i["weight"]), reverse=True)
    return items


def primary_concern(concerns: list[dict]) -> str | None:
    """The single concern the routine should be built around."""
    return concerns[0]["name"] if concerns else None


# ---------------------------------------------------------------------------
# Recommendation engine ("Generate Skincare Recommendations")
# ---------------------------------------------------------------------------
CONCERN_ADVICE: dict[str, str] = {
    "Acne": "Introduce a salicylic acid (BHA) cleanser or leave-on treatment 2-3x per week, and avoid picking at active spots — it drives post-inflammatory marks.",
    "Hyperpigmentation": "Daily broad-spectrum SPF 50 is non-negotiable: without it, brightening actives cannot outpace new pigment forming.",
    "Dark Spots": "Pair a vitamin C serum in the morning with diligent sun protection. Expect visible fading over 8-12 weeks, not days.",
    "Oiliness": "Use a lightweight gel moisturiser rather than skipping moisturiser — stripped skin overproduces oil to compensate.",
    "Wrinkles": "A nightly retinoid is the best-evidenced intervention. Start twice weekly and build up to avoid irritation.",
    "Fine Lines": "Focus on hydration and consistent SPF now. Prevention is far more effective than correction.",
    "Dry Skin": "Apply a ceramide-rich moisturiser onto damp skin to seal water in, and avoid hot water when cleansing.",
    "Redness": "Look for azelaic acid or centella. Avoid physical scrubs, alcohol-heavy toners, and very hot water.",
    "Sensitive Skin": "Patch-test every new product on your inner forearm for 48 hours, and introduce only one new active at a time.",
}


def generate_recommendations(
    concerns: list[dict],
    skin_type: str | None,
    breakdown: dict,
    sleep_hours: float | None,
    water_intake_l: float | None,
    consistency: float,
) -> list[str]:
    """Turn the assessment + score breakdown into specific, actionable guidance."""
    recs: list[str] = []

    # Concern-driven advice — the top three, most severe first
    for c in concerns[:3]:
        advice = CONCERN_ADVICE.get(c["name"])
        if advice:
            recs.append(f"{c['name']} ({c['severity']} severity): {advice}")

    # Score-driven advice — target whichever pillar is actually weakest
    b = breakdown.get("breakdown", breakdown)

    if b["sleep"]["score"] < 75:
        got = f"{sleep_hours:.1f}h" if sleep_hours else "under target"
        recs.append(f"Sleep is your weakest pillar ({got} vs the 8h target). Skin repairs its barrier overnight — this single change lifts your score more than any product will.")

    if b["hydration"]["score"] < 75:
        got = f"{water_intake_l:.1f}L" if water_intake_l else "below target"
        recs.append(f"Hydration is low ({got} vs 2.5L daily). Dehydrated skin looks dull and creases more readily.")

    if b["consistency"]["score"] < 70:
        recs.append(f"Routine consistency is {consistency:.0f}%. Skincare compounds — an average routine followed daily beats a perfect routine followed occasionally.")

    if b["lifestyle"]["score"] < 70:
        recs.append("Your lifestyle score is dragging the total down. Daily SPF and reduced environmental exposure are the highest-leverage fixes.")

    if b["skin_condition"]["score"] >= 90 and not concerns:
        recs.append("No significant concerns detected — your priority is maintenance. Keep SPF daily and resist over-treating healthy skin.")

    if (skin_type or "").lower() == "sensitive":
        recs.append("Because your skin is flagged sensitive, your routine has been built without acids, retinoids, or physical scrubs.")

    return recs
