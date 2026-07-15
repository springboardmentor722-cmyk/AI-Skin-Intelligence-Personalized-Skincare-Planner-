class WeightedSkinScoreEngine:
    """
    Deterministic Weighted Skin Score Engine.
    Calculates overall skin health based on predefined weights.
    """
    
    # Formula Weights
    WEIGHTS = {
        "skin_condition": 0.35,
        "lifestyle": 0.20,
        "sleep": 0.15,
        "routine_consistency": 0.20,
        "hydration": 0.10
    }

    @staticmethod
    def calculate_score(normalized_data: dict, routine_consistency_percentage: float = 0.0) -> dict:
        """
        Calculates individual and overall scores from 0-100.
        """
        lifestyle_factors = normalized_data.get("lifestyle_factors", {})
        concerns_profile = normalized_data.get("concerns_profile", {})
        
        # 1. Skin Condition (35%)
        # Base starts at 100, deduct points for concerns
        skin_condition_score = 100
        if concerns_profile.get("primary") != "None":
            skin_condition_score -= 25
        if concerns_profile.get("secondary") != "None":
            skin_condition_score -= 15
        skin_condition_score = max(0, skin_condition_score)
        
        # 2. Lifestyle (20%)
        stress_level = lifestyle_factors.get("stress_level", "Medium")
        lifestyle_score_map = {"Low": 100, "Medium": 70, "High": 40}
        lifestyle_score = lifestyle_score_map.get(stress_level, 70)
        
        # 3. Sleep (15%)
        sleep_quality = lifestyle_factors.get("sleep_quality", "Fair")
        sleep_score_map = {"Good": 100, "Fair": 60, "Poor": 30}
        sleep_score = sleep_score_map.get(sleep_quality, 60)
        
        # 4. Hydration (10%)
        hydration_status = lifestyle_factors.get("hydration_status", "Hydrated")
        hydration_score_map = {"Hydrated": 100, "Dehydrated": 40}
        hydration_score = hydration_score_map.get(hydration_status, 100)
        
        # 5. Routine Consistency (20%)
        routine_score = max(0, min(100, routine_consistency_percentage))
        
        # Calculate Overall Weighted Score
        overall_score = (
            (skin_condition_score * WeightedSkinScoreEngine.WEIGHTS["skin_condition"]) +
            (lifestyle_score * WeightedSkinScoreEngine.WEIGHTS["lifestyle"]) +
            (sleep_score * WeightedSkinScoreEngine.WEIGHTS["sleep"]) +
            (routine_score * WeightedSkinScoreEngine.WEIGHTS["routine_consistency"]) +
            (hydration_score * WeightedSkinScoreEngine.WEIGHTS["hydration"])
        )
        
        # Risk Level Calculation
        if overall_score >= 80:
            risk_level = "Low"
        elif 50 <= overall_score < 80:
            risk_level = "Medium"
        else:
            risk_level = "High"
            
        return {
            "overall_score": round(overall_score, 2),
            "individual_scores": {
                "skin_condition": skin_condition_score,
                "lifestyle": lifestyle_score,
                "sleep": sleep_score,
                "routine_consistency": routine_score,
                "hydration": hydration_score
            },
            "risk_level": risk_level,
            "score_breakdown": {
                "strengths": [k for k, v in locals().items() if "score" in k and isinstance(v, (int, float)) and v >= 80],
                "areas_for_improvement": [k for k, v in locals().items() if "score" in k and isinstance(v, (int, float)) and v < 60]
            }
        }
