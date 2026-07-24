from app.ai.ingredient_synonyms import same_ingredient
from app.ai.schemas import SuitabilityResult

# Confidence per rule is fixed and documented here, never learned — this is what
# makes the zero-missed-allergy requirement auditable (AI_ML.md model card;
# milestone_3.md §8's release-blocking test, not a metric to monitor).
_STRUCTURED_ALLERGY_EXACT_CONFIDENCE = 0.98
_STRUCTURED_ALLERGY_SYNONYM_CONFIDENCE = 0.75
_ALLERGY_EXACT_CONFIDENCE = 0.95
_ALLERGY_SUBSTRING_CONFIDENCE = 0.7
_SENSITIVITY_EXACT_CONFIDENCE = 0.9
_SENSITIVITY_SUBSTRING_CONFIDENCE = 0.65
_AVOID_FLAG_CONFIDENCE = 0.85
_BASELINE_CONFIDENCE = 0.6


def _tag_match(free_text: str | None, candidate: str) -> tuple[bool, bool]:
    """(exact, substring-or-synonym) — free_text is a comma-separated list of
    user-entered tags (allergies/sensitivities are free text, not a controlled
    vocabulary, milestone_3.md §"Inputs"). Conservative matching in both
    directions: a tag can be a substring of the ingredient name or vice versa
    ("retin" catching "Retinol", "Retinol" catching "Retinol/Retinyl Palmitate"),
    OR a tag can be a known synonym/INCI alternate name for the ingredient
    (Milestone 2 P12) — e.g. a "Vitamin C" tag must flag "Ascorbic Acid" even
    though neither string contains the other."""
    if not free_text or not candidate:
        return False, False
    candidate_lower = candidate.strip().lower()
    tags = [t.strip().lower() for t in free_text.split(",") if t.strip()]
    if candidate_lower in tags:
        return True, False
    fuzzy = any(
        candidate_lower in tag or tag in candidate_lower or same_ingredient(candidate_lower, tag)
        for tag in tags
    )
    return False, fuzzy


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
        structured_allergy_ingredients: list[tuple[int, str | None]] | None = None,
        candidate_ingredient_id: int | None = None,
    ) -> SuitabilityResult:
        # Milestone 2 P12 — the structured allergy list (P7, `skin_profile_allergies`,
        # ingredient ids) checked first: it's the authoritative, user-confirmed source
        # (picked from a real ingredient, not typed free text), so it must never be
        # shadowed by a weaker signal. An id match is exact; a name/INCI synonym match
        # against a *different* ingredient the user didn't literally pick is flagged
        # too, at lower confidence — "flag on uncertainty rather than suppress".
        for allergy_ingredient_id, allergy_ingredient_name in structured_allergy_ingredients or []:
            if (
                candidate_ingredient_id is not None
                and allergy_ingredient_id == candidate_ingredient_id
            ):
                return SuitabilityResult(
                    suitable=False,
                    confidence=_STRUCTURED_ALLERGY_EXACT_CONFIDENCE,
                    allergy_flag=True,
                    avoid_flag=False,
                    reasons=[f"Matches your recorded allergy to '{allergy_ingredient_name}'."],
                )
            if any(
                same_ingredient(allergy_ingredient_name, candidate)
                for candidate in filter(None, [ingredient_name, inci_name])
            ):
                return SuitabilityResult(
                    suitable=False,
                    confidence=_STRUCTURED_ALLERGY_SYNONYM_CONFIDENCE,
                    allergy_flag=True,
                    avoid_flag=False,
                    reasons=[
                        f"Possible allergy match: '{ingredient_name}' is a known alternate "
                        f"name for your recorded allergy to '{allergy_ingredient_name}'. "
                        "Check with a professional before using."
                    ],
                )

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
