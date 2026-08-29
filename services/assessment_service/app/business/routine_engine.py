"""
Dynamic Routine Generator.

Maps skin type -> AM/PM/Weekly step templates (a seeded decision matrix,
per Milestone 2 Step 1.3 - product catalog scraping is Milestone 3, so this
is a fixed internal lookup, not live product data).

Includes a safety guardrail: sensitive skin or severe redness (>7/10)
swaps harsh actives for gentle alternatives, and the AM routine always
ends with sun protection - non-negotiable, per the QA "mandatory sunscreen"
test.
"""

HARSH_ACTIVES = {
    "Salicylic Acid Treatment",
    "Vitamin C Serum",
    "Retinol Treatment",
    "Physical Exfoliant",
}
SOOTHING_ALTERNATIVE = "Azelaic Acid Calming Treatment"
SOOTHING_WEEKLY_ALTERNATIVE = "Centella Asiatica Hydrating Mask"

# (category, step_name) tuples, in application order.
ROUTINE_MATRIX = {
    "Oily": {
        "AM": [
            ("Cleansing", "Gel Cleanser"),
            ("Treatment", "Niacinamide Serum"),
            ("Moisturizing", "Lightweight Gel Moisturizer"),
            ("Sun Protection", "Broad Spectrum SPF 30+"),
        ],
        "PM": [
            ("Cleansing", "Oil Cleanser"),
            ("Cleansing", "Water-Based Cleanser"),
            ("Treatment", "Salicylic Acid Treatment"),
            ("Night Care", "Oil-Free Night Moisturizer"),
        ],
        "Weekly": [
            ("Exfoliation", "BHA Exfoliating Treatment (2x/week)"),
        ],
    },
    "Dry": {
        "AM": [
            ("Cleansing", "Cream Cleanser"),
            ("Treatment", "Hyaluronic Acid Serum"),
            ("Moisturizing", "Rich Moisturizer"),
            ("Sun Protection", "Broad Spectrum SPF 30+"),
        ],
        "PM": [
            ("Cleansing", "Oil Cleanser"),
            ("Cleansing", "Cream Cleanser"),
            ("Treatment", "Ceramide Treatment Serum"),
            ("Night Care", "Rich Night Cream"),
        ],
        "Weekly": [
            ("Exfoliation", "Gentle Lactic Acid Mask (1x/week)"),
        ],
    },
    "Combination": {
        "AM": [
            ("Cleansing", "Gel Cleanser"),
            ("Treatment", "Vitamin C Serum"),
            ("Moisturizing", "Lightweight Hydrator"),
            ("Sun Protection", "Broad Spectrum SPF 30+"),
        ],
        "PM": [
            ("Cleansing", "Micellar Water"),
            ("Cleansing", "Gentle Foam Cleanser"),
            ("Treatment", "Balancing Treatment Serum"),
            ("Night Care", "Ceramide Night Cream"),
        ],
        "Weekly": [
            ("Exfoliation", "AHA/BHA Exfoliating Treatment (2x/week)"),
        ],
    },
    "Sensitive": {
        # No harsh "Treatment" category at all in the baseline, per spec Entry B.
        "AM": [
            ("Cleansing", "Fragrance-Free Gentle Cleanser"),
            ("Moisturizing", "Soothing Barrier Moisturizer"),
            ("Sun Protection", "Mineral SPF 30+ (Zinc Oxide)"),
        ],
        "PM": [
            ("Cleansing", "Fragrance-Free Gentle Cleanser"),
            ("Moisturizing", "Soothing Barrier Moisturizer"),
        ],
        "Weekly": [
            ("Exfoliation", "Centella Asiatica Hydrating Mask (1x/week)"),
        ],
    },
    "Normal": {
        # Balanced skin, no dominant issue — same shape as Combination's
        # routine since neither needs aggressive oil control or heavy repair.
        "AM": [
            ("Cleansing", "Gentle Foam Cleanser"),
            ("Treatment", "Vitamin C Serum"),
            ("Moisturizing", "Lightweight Hydrator"),
            ("Sun Protection", "Broad Spectrum SPF 30+"),
        ],
        "PM": [
            ("Cleansing", "Gentle Foam Cleanser"),
            ("Treatment", "Balancing Treatment Serum"),
            ("Night Care", "Ceramide Night Cream"),
        ],
        "Weekly": [
            ("Exfoliation", "AHA/BHA Exfoliating Treatment (1x/week)"),
        ],
    },
}


def _apply_safety_guardrails(steps: list[tuple], skin_type: str, redness_severity: int) -> list[tuple]:
    """Swap harsh actives for gentle ones when skin is sensitive or redness is severe."""
    needs_guardrail = skin_type == "Sensitive" or redness_severity > 7
    if not needs_guardrail:
        return steps

    adjusted = []
    for category, name in steps:
        if name in HARSH_ACTIVES:
            adjusted.append((category, SOOTHING_ALTERNATIVE))
        elif category == "Exfoliation" and "Exfoliating" in name:
            adjusted.append((category, SOOTHING_WEEKLY_ALTERNATIVE))
        else:
            adjusted.append((category, name))
    return adjusted


def generate_routine_steps(skin_type: str, redness_severity: int = 0) -> dict:
    """
    Returns {"AM": [(category, name), ...], "PM": [...], "Weekly": [...]}
    with safety guardrails already applied.
    """
    template = ROUTINE_MATRIX.get(skin_type, ROUTINE_MATRIX["Combination"])

    result = {}
    for time_of_day, steps in template.items():
        result[time_of_day] = _apply_safety_guardrails(steps, skin_type, redness_severity)

    # Non-negotiable: every AM routine must end with sun protection.
    am_categories = [c for c, _ in result["AM"]]
    if "Sun Protection" not in am_categories:
        result["AM"].append(("Sun Protection", "Broad Spectrum SPF 30+"))

    return result
