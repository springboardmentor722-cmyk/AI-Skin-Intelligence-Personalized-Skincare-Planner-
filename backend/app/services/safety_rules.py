# app/services/safety_rules.py
"""
Safety Rule Engine — Milestone 2, Section 6.
Validates skin conditions, allergies, and sensitivities BEFORE generating
ingredient recommendations or routines. Blocks unsafe ingredients and
proposes evidence-based safe alternatives.
All rules are deterministic and based on dermatological safety guidelines.
"""
from typing import Optional

# ============================================================
# INGREDIENT SAFETY RULE DATABASE
# ============================================================

# Each rule:
#   trigger_conditions: set of concern keys / flags that activate the rule
#   blocked_ingredients: ingredients to block if rule triggers
#   safe_alternatives: what to substitute with
#   warning_message: human-readable advisory

SAFETY_RULES = [
    {
        "rule_id": "no_retinol_pregnancy",
        "label": "Pregnancy Safety",
        "trigger_flags": {"is_pregnant"},
        "trigger_concerns": set(),
        "blocked_ingredients": ["Retinol", "Retinyl Palmitate", "Retinaldehyde", "Tretinoin", "Adapalene", "Isotretinoin"],
        "safe_alternatives": {
            "Retinol": "Bakuchiol",
            "Retinyl Palmitate": "Bakuchiol",
            "Retinaldehyde": "Bakuchiol",
            "Tretinoin": "Azelaic Acid",
            "Adapalene": "Azelaic Acid",
        },
        "warning_message": "Retinoids (Retinol, Tretinoin, etc.) are contraindicated during pregnancy. Bakuchiol is a safe plant-based alternative.",
    },
    {
        "rule_id": "no_strong_aha_sensitive",
        "label": "Strong AHA — Sensitive/Redness Skin",
        "trigger_flags": set(),
        "trigger_concerns": {"sensitive_skin", "redness"},
        "blocked_ingredients": ["Glycolic Acid", "Lactic Acid", "Mandelic Acid"],
        "safe_alternatives": {
            "Glycolic Acid": "Polyhydroxy Acid (PHA)",
            "Lactic Acid": "Polyhydroxy Acid (PHA)",
            "Mandelic Acid": "Azelaic Acid",
        },
        "warning_message": "Strong AHA exfoliants (Glycolic, Lactic Acid) can worsen redness and irritation in sensitive skin. PHAs or Azelaic Acid are gentler alternatives.",
    },
    {
        "rule_id": "no_strong_bha_severe_redness",
        "label": "Strong BHA — Severe Redness",
        "trigger_flags": set(),
        "trigger_concerns": {"redness"},
        "trigger_severity_threshold": "high",  # only blocks when redness is rated 'high'
        "blocked_ingredients": ["Salicylic Acid"],
        "safe_alternatives": {
            "Salicylic Acid": "Azelaic Acid",
        },
        "warning_message": "High-concentration BHA (Salicylic Acid) may aggravate severe redness/rosacea. Azelaic Acid provides anti-inflammatory benefits without the irritation risk.",
    },
    {
        "rule_id": "no_fragrance_sensitive",
        "label": "Fragrance — Sensitive/Reactive Skin",
        "trigger_flags": set(),
        "trigger_concerns": {"sensitive_skin"},
        "blocked_ingredients": ["Fragrance", "Parfum", "Essential Oils"],
        "safe_alternatives": {
            "Fragrance": "Fragrance-Free Formulation",
            "Parfum": "Fragrance-Free Formulation",
            "Essential Oils": "Fragrance-Free Formulation",
        },
        "warning_message": "Fragrances and essential oils are a leading cause of contact dermatitis in sensitive skin. Choose fragrance-free formulations.",
    },
    {
        "rule_id": "no_active_acne_occlusive",
        "label": "Occlusive Oils — Active Acne",
        "trigger_flags": set(),
        "trigger_concerns": {"acne"},
        "trigger_severity_threshold": "high",
        "blocked_ingredients": ["Coconut Oil", "Cocoa Butter", "Mineral Oil"],
        "safe_alternatives": {
            "Coconut Oil": "Squalane",
            "Cocoa Butter": "Squalane",
            "Mineral Oil": "Squalane",
        },
        "warning_message": "Highly occlusive ingredients like Coconut Oil can clog pores and worsen active acne. Non-comedogenic alternatives like Squalane are preferred.",
    },
    {
        "rule_id": "no_strong_exfoliant_broken_skin",
        "label": "Exfoliants — Broken/Compromised Skin",
        "trigger_flags": {"broken_skin"},
        "trigger_concerns": set(),
        "blocked_ingredients": ["Glycolic Acid", "Salicylic Acid", "Lactic Acid", "Mandelic Acid", "Retinol"],
        "safe_alternatives": {
            "Glycolic Acid": "Centella Asiatica (Cica)",
            "Salicylic Acid": "Allantoin",
            "Lactic Acid": "Centella Asiatica (Cica)",
            "Retinol": "Centella Asiatica (Cica)",
        },
        "warning_message": "Exfoliating acids and Retinol should be avoided on broken or compromised skin. Focus on barrier-repair ingredients (Centella, Allantoin, Ceramides).",
    },
]


def apply_safety_rules(
    skin_type: Optional[str] = None,
    concerns: Optional[list] = None,
    concern_severities: Optional[dict] = None,
    allergies: Optional[list] = None,
    sensitivities: Optional[list] = None,
    is_pregnant: bool = False,
    broken_skin: bool = False,
) -> dict:
    """
    Evaluates all safety rules against the user's profile.

    Args:
        skin_type: e.g. "sensitive", "dry"
        concerns: list of concern keys e.g. ["acne", "redness"]
        concern_severities: {concern_key: "high"/"medium"/"low"}
        allergies: list of allergen strings from user profile
        sensitivities: list of sensitivity strings from user profile
        is_pregnant: boolean flag
        broken_skin: boolean flag

    Returns:
        {
            "blocked_ingredients": ["Retinol", ...],
            "warnings": ["Warning message 1", ...],
            "safe_alternatives": {"Retinol": "Bakuchiol", ...},
            "rules_triggered": ["rule_id", ...]
        }
    """
    concerns_set = set(c.lower().replace(" ", "_") for c in (concerns or []))
    severities = {k.lower().replace(" ", "_"): v for k, v in (concern_severities or {}).items()}

    # Normalise skin type into concerns set (e.g. "sensitive" skin → adds "sensitive_skin" concern key)
    if skin_type and skin_type.lower() in ("sensitive",):
        concerns_set.add("sensitive_skin")

    active_flags = set()
    if is_pregnant:
        active_flags.add("is_pregnant")
    if broken_skin:
        active_flags.add("broken_skin")

    all_blocked: set[str] = set()
    all_warnings: list[str] = []
    all_alternatives: dict[str, str] = {}
    rules_triggered: list[str] = []

    for rule in SAFETY_RULES:
        flag_match = bool(rule["trigger_flags"] & active_flags)
        concern_match = bool(rule["trigger_concerns"] & concerns_set)

        # Severity threshold check (only block when concern is at or above threshold)
        severity_ok = True
        if "trigger_severity_threshold" in rule and concern_match:
            required_sev = rule["trigger_severity_threshold"]
            relevant_concerns = rule["trigger_concerns"] & concerns_set
            severity_ok = any(
                severities.get(c, "medium") == required_sev
                for c in relevant_concerns
            )

        if (flag_match or concern_match) and severity_ok:
            all_blocked.update(rule["blocked_ingredients"])
            all_warnings.append(rule["warning_message"])
            all_alternatives.update(rule.get("safe_alternatives", {}))
            rules_triggered.append(rule["rule_id"])

    # Also block anything the user is explicitly allergic/sensitive to
    for allergen in (allergies or []) + (sensitivities or []):
        a = allergen.strip()
        if a:
            all_blocked.add(a)

    return {
        "blocked_ingredients": sorted(all_blocked),
        "warnings": all_warnings,
        "safe_alternatives": all_alternatives,
        "rules_triggered": rules_triggered,
    }


def filter_safe_ingredients(
    ingredient_names: list[str],
    safety_result: dict,
) -> list[str]:
    """
    Filters out any ingredient that is blocked by the safety rule engine.
    Case-insensitive matching.
    """
    blocked_lower = {b.lower() for b in safety_result.get("blocked_ingredients", [])}
    return [ing for ing in ingredient_names if ing.lower() not in blocked_lower]
