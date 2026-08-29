"""
Concern Prioritization Engine.

identify_skin_concerns() scans the user's self-reported severities and
returns them sorted by severity (highest first), each labeled High/Medium/
Low/None. The top-ranked concern becomes the "primary concern" the routine
generator builds around.
"""
from services.assessment_service.app.business.scoring_engine import severity_level

CONCERN_LABELS = {
    "acne_severity": "Acne",
    "hyperpigmentation_severity": "Hyperpigmentation",
    "redness_severity": "Redness",
    "wrinkles_severity": "Wrinkles",
}


def identify_skin_concerns(severities: dict) -> list[dict]:
    """
    severities: {"acne_severity": 7, "hyperpigmentation_severity": 4, ...}
    Returns concerns sorted by severity descending, zero-severity entries excluded.
    """
    concerns = []
    for field, severity in severities.items():
        if severity <= 0:
            continue
        concerns.append({
            "name": CONCERN_LABELS.get(field, field),
            "field": field,
            "severity": severity,
            "level": severity_level(severity),
        })

    concerns.sort(key=lambda c: c["severity"], reverse=True)
    return concerns


def get_primary_concern(concerns: list[dict]) -> str | None:
    """Highest-severity concern wins; ties keep the first one found (stable sort)."""
    return concerns[0]["name"] if concerns else None
