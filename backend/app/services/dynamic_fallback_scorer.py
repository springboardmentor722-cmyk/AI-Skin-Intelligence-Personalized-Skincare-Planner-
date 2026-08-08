"""
Dynamic Fallback Scoring Engine.
Pure rule-based (NO LLM). Calculates a skin health score from the user's
actual questionnaire answers when the Groq Vision API is offline.
"""
import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from uuid import UUID

logger = logging.getLogger(__name__)


class DynamicFallbackScorer:
    """
    Deterministic rule-based skin score calculator.
    Uses onboarding profile, lifestyle profile, screening history, and lifestyle logs
    to produce a dynamic score instead of a static hardcoded value.
    """

    # ── Skin Type Base Scores (Weight: 15%) ──────────────────────────────
    SKIN_TYPE_SCORES = {
        "oily": 70,
        "dry": 65,
        "combination": 75,
        "normal": 85,
        "sensitive": 60,
    }

    # ── Concern Penalty Map (Weight: 25%) ────────────────────────────────
    CONCERN_PENALTIES = {
        "acne": 25,
        "severe acne": 40,
        "mild acne breakouts": 20,
        "moderate acne": 30,
        "breakouts": 20,
        "pigmentation": 15,
        "hyperpigmentation": 15,
        "dark spots": 15,
        "dryness": 10,
        "dehydration": 12,
        "aging": 15,
        "wrinkles": 15,
        "fine lines": 12,
        "redness": 20,
        "moderate redness": 15,
        "rosacea": 25,
        "uneven texture": 10,
        "uneven skin tone": 12,
        "enlarged pores": 8,
        "oily t-zone": 8,
        "sun damage": 18,
        "eczema": 30,
        "psoriasis": 30,
    }

    # ── Age Group Scores (Weight: 10%) ───────────────────────────────────
    AGE_GROUP_SCORES = {
        "18-24": 90,
        "25-34": 85,
        "35-44": 75,
        "45-54": 65,
        "55+": 60,
    }

    # ── Concern → Recommendation Mapping ─────────────────────────────────
    CONCERN_RECOMMENDATIONS = {
        "acne": [
            "Use a gentle, non-foaming cleanser with salicylic acid (BHA)",
            "Apply a lightweight, oil-free moisturizer",
            "Spot treat with benzoyl peroxide or tea tree oil",
        ],
        "severe acne": [
            "Use a medicated cleanser with 2% salicylic acid",
            "Apply a retinoid treatment (adapalene) in the evening",
            "Consider consulting a dermatologist for prescription options",
        ],
        "redness": [
            "Use a gentle, fragrance-free cleanser",
            "Apply a soothing barrier-repair serum with centella asiatica",
            "Use a mineral sunscreen with zinc oxide daily",
        ],
        "dryness": [
            "Use a hydrating cream cleanser instead of foaming",
            "Apply hyaluronic acid serum on damp skin",
            "Layer a rich ceramide moisturizer morning and night",
        ],
        "pigmentation": [
            "Use a Vitamin C serum (10-20%) every morning",
            "Apply a niacinamide serum to even skin tone",
            "Wear SPF 50+ sunscreen daily without exception",
        ],
        "aging": [
            "Introduce a retinol serum gradually (start 2x per week)",
            "Use a peptide-rich moisturizer for collagen support",
            "Apply SPF 50+ sunscreen daily to prevent further damage",
        ],
        "oily": [
            "Use a gentle foaming cleanser with niacinamide",
            "Apply a lightweight gel moisturizer",
            "Use a clay mask weekly to control excess sebum",
        ],
        "sensitive": [
            "Use a fragrance-free, minimal-ingredient cleanser",
            "Apply a barrier-repair cream with ceramides",
            "Patch test all new products before full application",
        ],
    }

    # ── Default fallback recommendations ─────────────────────────────────
    DEFAULT_RECOMMENDATIONS = [
        "Use a gentle cleanser suited to your skin type",
        "Apply a broad-spectrum SPF 30+ sunscreen daily",
        "Stay hydrated and maintain a consistent skincare routine",
    ]

    @classmethod
    def calculate(
        cls,
        db: Optional[Session] = None,
        user_id: Optional[UUID] = None,
    ) -> dict:
        """
        Calculate a dynamic skin health score from the user's actual data.
        Returns the same shape as the Groq Vision API response:
        {
            "overall_score": int,
            "detected_concerns": List[str],
            "recommendations": List[str],
            "scoring_method": "dynamic_fallback"
        }
        """
        # Gather all user data
        skin_type = "normal"
        concerns_list: List[str] = []
        sensitivities_list: List[str] = []
        age_group = "25-34"
        sleep_quality = "Fair"
        water_intake_str = ""
        stress_level = "Medium"
        smoking = "Non-Smoker"
        outdoor_time = "Moderate"
        sleep_hours: Optional[float] = None
        water_intake_liters: Optional[float] = None

        if db and user_id:
            try:
                skin_type, concerns_list, sensitivities_list, age_group = cls._load_skin_profile(db, user_id)
            except Exception as e:
                logger.warning(f"Could not load skin profile for fallback score: {e}")

            try:
                sleep_quality, water_intake_str = cls._load_lifestyle_profile(db, user_id)
            except Exception as e:
                logger.warning(f"Could not load lifestyle profile for fallback score: {e}")

            try:
                screening_data = cls._load_latest_screening(db, user_id)
                if screening_data:
                    if screening_data.get("primary_concern"):
                        concerns_list.append(screening_data["primary_concern"])
                    if screening_data.get("secondary_concern") and screening_data["secondary_concern"] != "Unknown":
                        concerns_list.append(screening_data["secondary_concern"])
                    if screening_data.get("stress_level"):
                        stress_level = screening_data["stress_level"]
                    if screening_data.get("smoking"):
                        smoking = screening_data["smoking"]
            except Exception as e:
                logger.warning(f"Could not load screening data for fallback score: {e}")

            try:
                lifestyle_data = cls._load_latest_lifestyle_log(db, user_id)
                if lifestyle_data:
                    if lifestyle_data.get("sleep_duration"):
                        sleep_hours = lifestyle_data["sleep_duration"]
                    if lifestyle_data.get("water_intake"):
                        water_intake_liters = lifestyle_data["water_intake"]
                    if lifestyle_data.get("stress"):
                        stress_level = lifestyle_data["stress"]
                    if lifestyle_data.get("outdoor_time"):
                        outdoor_time = lifestyle_data["outdoor_time"]
                    if lifestyle_data.get("smoking"):
                        smoking = lifestyle_data["smoking"]
            except Exception as e:
                logger.warning(f"Could not load lifestyle log for fallback score: {e}")

        # Deduplicate concerns
        unique_concerns = list(dict.fromkeys(concerns_list))

        # ═══ Calculate Sub-Scores ═══

        # 1. Skin Type Base (15%)
        skin_type_score = cls.SKIN_TYPE_SCORES.get(skin_type.lower(), 75)

        # 2. Concern Severity (25%) — start at 100, deduct per concern
        concern_score = 100
        for concern in unique_concerns:
            concern_lower = concern.lower().strip()
            penalty = cls.CONCERN_PENALTIES.get(concern_lower, 0)
            if penalty == 0:
                # Partial match: check if any key is contained in the concern string
                for key, val in cls.CONCERN_PENALTIES.items():
                    if key in concern_lower:
                        penalty = val
                        break
                if penalty == 0:
                    penalty = 10  # Generic small penalty for unknown concerns
            concern_score -= penalty
        concern_score = max(10, min(100, concern_score))

        # 3. Lifestyle (20%) — stress, smoking, outdoor
        lifestyle_score = 60
        stress_map = {"low": 100, "moderate": 75, "medium": 70, "high": 40}
        lifestyle_score = stress_map.get(stress_level.lower(), 65)
        if smoking and smoking.lower() in ["non-smoker", "no", "none"]:
            lifestyle_score = min(100, lifestyle_score + 10)
        elif smoking and smoking.lower() in ["smoker", "yes", "heavy"]:
            lifestyle_score = max(0, lifestyle_score - 15)
        if outdoor_time and outdoor_time.lower() in ["minimal", "moderate"]:
            lifestyle_score = min(100, lifestyle_score + 5)
        elif outdoor_time and outdoor_time.lower() in ["heavy", "extensive"]:
            lifestyle_score = max(0, lifestyle_score - 5)

        # 4. Hydration (15%) — from lifestyle log or profile
        hydration_score = 60
        if water_intake_liters is not None:
            if water_intake_liters >= 2.5:
                hydration_score = 100
            elif water_intake_liters >= 2.0:
                hydration_score = 80
            elif water_intake_liters >= 1.5:
                hydration_score = 60
            else:
                hydration_score = 30
        elif water_intake_str:
            # From onboarding profile: stored as text like "2-3 liters", "Less than 1 liter"
            wi_lower = water_intake_str.lower()
            if "3" in wi_lower or "plenty" in wi_lower:
                hydration_score = 100
            elif "2" in wi_lower:
                hydration_score = 80
            elif "1.5" in wi_lower or "moderate" in wi_lower:
                hydration_score = 60
            else:
                hydration_score = 40

        # 5. Sleep (15%)
        sleep_score = 65
        if sleep_hours is not None:
            if sleep_hours >= 8:
                sleep_score = 100
            elif sleep_hours >= 7:
                sleep_score = 85
            elif sleep_hours >= 6:
                sleep_score = 65
            elif sleep_hours >= 5:
                sleep_score = 45
            else:
                sleep_score = 30
        elif sleep_quality:
            sq_lower = sleep_quality.lower()
            sleep_map = {"good": 90, "fair": 65, "poor": 35}
            sleep_score = sleep_map.get(sq_lower, 65)

        # 6. Age Group (10%)
        age_score = cls.AGE_GROUP_SCORES.get(age_group, 80)

        # ═══ Weighted Overall Score ═══
        overall = int(
            (skin_type_score * 0.15)
            + (concern_score * 0.25)
            + (lifestyle_score * 0.20)
            + (hydration_score * 0.15)
            + (sleep_score * 0.15)
            + (age_score * 0.10)
        )
        overall = max(1, min(100, overall))

        # ═══ Generate Dynamic Concerns & Recommendations ═══
        detected_concerns = cls._build_detected_concerns(unique_concerns, skin_type, sensitivities_list)
        recommendations = cls._build_recommendations(unique_concerns, skin_type)

        return {
            "overall_score": overall,
            "detected_concerns": detected_concerns,
            "recommendations": recommendations,
            "scoring_method": "dynamic_fallback",
            "score_breakdown": {
                "skin_type_score": skin_type_score,
                "concern_score": concern_score,
                "lifestyle_score": lifestyle_score,
                "hydration_score": hydration_score,
                "sleep_score": sleep_score,
                "age_score": age_score,
            },
        }

    # ── Data Loaders ─────────────────────────────────────────────────────

    @staticmethod
    def _load_skin_profile(db: Session, user_id: UUID):
        from app.models.profile import SkinProfile

        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        if not profile:
            return "normal", [], [], "25-34"

        skin_type = profile.skin_type or "normal"
        concerns = [c.strip() for c in (profile.skin_concerns or "").split(",") if c.strip()]
        sensitivities = [s.strip() for s in (profile.sensitivities or "").split(",") if s.strip()]
        age_group = profile.age_group or "25-34"

        return skin_type, concerns, sensitivities, age_group

    @staticmethod
    def _load_lifestyle_profile(db: Session, user_id: UUID):
        from app.models.profile import LifestyleProfile

        profile = db.query(LifestyleProfile).filter(LifestyleProfile.user_id == user_id).first()
        if not profile:
            return "Fair", ""

        return profile.sleep_quality or "Fair", profile.water_intake or ""

    @staticmethod
    def _load_latest_screening(db: Session, user_id: UUID) -> Optional[dict]:
        from app.models.skin_screening import SkinScreening

        screening = (
            db.query(SkinScreening)
            .filter(SkinScreening.user_id == user_id)
            .order_by(SkinScreening.created_at.desc())
            .first()
        )
        if not screening:
            return None

        return {
            "primary_concern": screening.primary_concern,
            "secondary_concern": screening.secondary_concern,
            "stress_level": screening.stress_level,
            "smoking": screening.smoking,
        }

    @staticmethod
    def _load_latest_lifestyle_log(db: Session, user_id: UUID) -> Optional[dict]:
        from app.models.lifestyle import LifestyleLog

        log = (
            db.query(LifestyleLog)
            .filter(LifestyleLog.user_id == user_id)
            .order_by(LifestyleLog.created_at.desc())
            .first()
        )
        if not log:
            return None

        return {
            "sleep_duration": log.sleep_duration,
            "water_intake": log.water_intake,
            "stress": log.stress,
            "outdoor_time": log.outdoor_time,
            "smoking": log.smoking,
        }

    # ── Concern & Recommendation Builders ────────────────────────────────

    @classmethod
    def _build_detected_concerns(
        cls, concerns: List[str], skin_type: str, sensitivities: List[str]
    ) -> List[str]:
        """Build a detected_concerns list from the user's actual data."""
        detected = []

        if concerns:
            detected.extend(concerns)
        else:
            # Infer from skin type if no explicit concerns
            skin_type_lower = skin_type.lower()
            if skin_type_lower == "oily":
                detected.append("Excess Oil Production")
            elif skin_type_lower == "dry":
                detected.append("Skin Dryness")
            elif skin_type_lower == "sensitive":
                detected.append("Skin Sensitivity")
            elif skin_type_lower == "combination":
                detected.append("Combination Skin (Oily T-Zone)")
            else:
                detected.append("General Skin Maintenance")

        if sensitivities:
            for s in sensitivities[:2]:  # Cap at 2 sensitivity entries
                detected.append(f"Sensitivity: {s}")

        # Deduplicate and cap at 5
        seen = set()
        unique = []
        for d in detected:
            if d.lower() not in seen:
                seen.add(d.lower())
                unique.append(d)
        return unique[:5]

    @classmethod
    def _build_recommendations(cls, concerns: List[str], skin_type: str) -> List[str]:
        """Build recommendations from the user's concerns using rule mapping."""
        recommendations = []

        for concern in concerns:
            concern_lower = concern.lower().strip()
            # Direct match
            if concern_lower in cls.CONCERN_RECOMMENDATIONS:
                recommendations.extend(cls.CONCERN_RECOMMENDATIONS[concern_lower])
                continue
            # Partial match
            for key, recs in cls.CONCERN_RECOMMENDATIONS.items():
                if key in concern_lower:
                    recommendations.extend(recs)
                    break

        # Add skin-type-specific recommendations if we have few
        if len(recommendations) < 2:
            skin_lower = skin_type.lower()
            if skin_lower in cls.CONCERN_RECOMMENDATIONS:
                recommendations.extend(cls.CONCERN_RECOMMENDATIONS[skin_lower])

        # Fallback if still empty
        if not recommendations:
            recommendations = cls.DEFAULT_RECOMMENDATIONS.copy()

        # Deduplicate and cap at 5
        seen = set()
        unique = []
        for r in recommendations:
            if r.lower() not in seen:
                seen.add(r.lower())
                unique.append(r)
        return unique[:5]
