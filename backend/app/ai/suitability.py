from app.ai.schemas import SuitabilityResult

# Confidence per rule is fixed and documented here, never learned — this is what
# makes the zero-missed-allergy requirement auditable (AI_ML.md model card;
# milestone_3.md §8's release-blocking test, not a metric to monitor).
_ALLERGY_EXACT_CONFIDENCE = 0.95
_ALLERGY_SUBSTRING_CONFIDENCE = 0.7
_SENSITIVITY_EXACT_CONFIDENCE = 0.9
_SENSITIVITY_SUBSTRING_CONFIDENCE = 0.65
_AVOID_FLAG_CONFIDENCE = 0.85
_BASELINE_CONFIDENCE = 0.6


def _tag_match(free_text: str | None, candidate: str) -> tuple[bool, bool]:
    """(exact, substring) — free_text is a comma-separated list of user-entered
    tags (allergies/sensitivities are free text, not a controlled vocabulary,
    milestone_3.md §"Inputs"). Conservative containment matching in both
    directions: a tag can be a substring of the ingredient name or vice versa
    ("retin" catching "Retinol", "Retinol" catching "Retinol/Retinyl Palmitate")."""
    if not free_text or not candidate:
        return False, False
    candidate_lower = candidate.strip().lower()
    tags = [t.strip().lower() for t in free_text.split(",") if t.strip()]
    if candidate_lower in tags:
        return True, False
    substring = any(candidate_lower in tag or tag in candidate_lower for tag in tags)
    return False, substring


class RealIngredientSuitability:
    """Rule-based, not ML — see app/ai/schemas.py's IngredientSuitability Protocol
    docstring for why. Allergy check runs first and returns immediately: it must
    never be shadowed by a lower-priority signal (sensitivity, avoid-flag) being
    checked first."""

    def evaluate(
        self,
        *,
        ingredient_name: str,
        inci_name: str | None,
        skin_type_name: str | None,
        allergies: str | None,
        sensitivities: str | None,
        avoid_reason: str | None,
    ) -> SuitabilityResult:
        for candidate in filter(None, [ingredient_name, inci_name]):
            exact, substring = _tag_match(allergies, candidate)
            if exact:
                return SuitabilityResult(
                    suitable=False,
                    confidence=_ALLERGY_EXACT_CONFIDENCE,
                    allergy_flag=True,
                    avoid_flag=False,
                    reasons=[f"Matches your recorded allergy to '{candidate}' (exact match)."],
                )
            if substring:
                return SuitabilityResult(
                    suitable=False,
                    confidence=_ALLERGY_SUBSTRING_CONFIDENCE,
                    allergy_flag=True,
                    avoid_flag=False,
                    reasons=[
                        f"Possible allergy match: '{candidate}' overlaps a tag in your "
                        "recorded allergies. Check with a professional before using."
                    ],
                )

        for candidate in filter(None, [ingredient_name, inci_name]):
            exact, substring = _tag_match(sensitivities, candidate)
            if exact:
                return SuitabilityResult(
                    suitable=False,
                    confidence=_SENSITIVITY_EXACT_CONFIDENCE,
                    allergy_flag=False,
                    avoid_flag=False,
                    reasons=[f"Matches your recorded sensitivity to '{candidate}'."],
                )
            if substring:
                return SuitabilityResult(
                    suitable=False,
                    confidence=_SENSITIVITY_SUBSTRING_CONFIDENCE,
                    allergy_flag=False,
                    avoid_flag=False,
                    reasons=[f"Possible sensitivity match: '{candidate}'."],
                )

        if avoid_reason:
            prefix = f"Not recommended for {skin_type_name} skin: " if skin_type_name else ""
            return SuitabilityResult(
                suitable=False,
                confidence=_AVOID_FLAG_CONFIDENCE,
                allergy_flag=False,
                avoid_flag=True,
                reasons=[f"{prefix}{avoid_reason}"],
            )

        suffix = f" your {skin_type_name} skin profile" if skin_type_name else " your profile"
        return SuitabilityResult(
            suitable=True,
            confidence=_BASELINE_CONFIDENCE,
            allergy_flag=False,
            avoid_flag=False,
            reasons=[f"No known conflicts with{suffix}."],
        )
