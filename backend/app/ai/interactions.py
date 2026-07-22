"""Curated pairwise ingredient interaction rules (M3-B, PDF Module 5 "interaction
analysis"). Hand-curated per docs/DATASETS_AND_APIS.md §3: INCIDecoder/COSDNA have no
public API and must never be scraped — these sites (and standard cosmetic-chemistry
references) are used as a *human* reference to write the facts below, quality over
quantity. Every pair here is well-established, non-controversial skincare-chemistry
guidance, not an invented judgment call; anything genuinely disputed among real
sources is left out rather than asserted as fact."""

from typing import Literal, TypedDict

Verdict = Literal["avoid", "caution", "synergy"]


class Interaction(TypedDict):
    verdict: Verdict
    reason: str


_INTERACTIONS: dict[frozenset[str], Interaction] = {
    frozenset({"retinol", "glycolic acid"}): {
        "verdict": "avoid",
        "reason": (
            "Both increase cell turnover and exfoliation — combining raises the risk "
            "of irritation, redness, and a compromised skin barrier. Use on "
            "alternating nights, or one AM / one PM."
        ),
    },
    frozenset({"retinol", "lactic acid"}): {
        "verdict": "avoid",
        "reason": (
            "Both increase cell turnover and exfoliation — combining raises the risk "
            "of irritation and barrier disruption. Use on alternating nights."
        ),
    },
    frozenset({"retinol", "salicylic acid"}): {
        "verdict": "avoid",
        "reason": (
            "Layering a retinoid with a BHA exfoliant compounds dryness and "
            "irritation risk. Use on alternating nights, or one AM / one PM."
        ),
    },
    frozenset({"glycolic acid", "salicylic acid"}): {
        "verdict": "caution",
        "reason": (
            "Layering two exfoliating acids in one routine compounds irritation "
            "risk; most routines use only one acid type per application."
        ),
    },
    frozenset({"glycolic acid", "lactic acid"}): {
        "verdict": "caution",
        "reason": "Both are AHAs — layering them compounds exfoliation and irritation risk.",
    },
    frozenset({"lactic acid", "salicylic acid"}): {
        "verdict": "caution",
        "reason": (
            "Layering an AHA with a BHA compounds irritation risk; most routines "
            "use only one acid type per application."
        ),
    },
    frozenset({"hyaluronic acid", "retinol"}): {
        "verdict": "synergy",
        "reason": (
            "Hyaluronic acid's humectant hydration helps offset retinol's dryness "
            "and irritation — a commonly recommended pairing."
        ),
    },
    frozenset({"hyaluronic acid", "niacinamide"}): {
        "verdict": "synergy",
        "reason": "No known conflict; hyaluronic acid's hydration pairs well with most actives.",
    },
    frozenset({"hyaluronic acid", "ascorbic acid"}): {
        "verdict": "synergy",
        "reason": "No known conflict; hyaluronic acid's hydration pairs well with most actives.",
    },
    frozenset({"hyaluronic acid", "glycolic acid"}): {
        "verdict": "synergy",
        "reason": (
            "Hyaluronic acid's hydration helps offset an AHA's dryness — a "
            "commonly recommended pairing."
        ),
    },
    frozenset({"hyaluronic acid", "salicylic acid"}): {
        "verdict": "synergy",
        "reason": (
            "Hyaluronic acid's hydration helps offset a BHA's dryness — a "
            "commonly recommended pairing."
        ),
    },
    frozenset({"ceramide np", "retinol"}): {
        "verdict": "synergy",
        "reason": (
            "Ceramides support the skin barrier — commonly recommended alongside "
            "retinoids to offset dryness and irritation."
        ),
    },
    frozenset({"ceramide ap", "retinol"}): {
        "verdict": "synergy",
        "reason": (
            "Ceramides support the skin barrier — commonly recommended alongside "
            "retinoids to offset dryness and irritation."
        ),
    },
    frozenset({"ceramide np", "glycolic acid"}): {
        "verdict": "synergy",
        "reason": "Ceramides help offset an AHA's barrier-thinning effect — a supportive pairing.",
    },
    frozenset({"ceramide ap", "glycolic acid"}): {
        "verdict": "synergy",
        "reason": "Ceramides help offset an AHA's barrier-thinning effect — a supportive pairing.",
    },
}


def get_interaction(ingredient_name_a: str, ingredient_name_b: str) -> Interaction | None:
    """None means "no curated interaction documented" — never a fabricated verdict
    for a pair this table doesn't actually cover."""
    key_a = ingredient_name_a.strip().lower()
    key_b = ingredient_name_b.strip().lower()
    if key_a == key_b:
        return None
    return _INTERACTIONS.get(frozenset({key_a, key_b}))
