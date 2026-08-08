import json
from typing import List, Dict, Any

class IngredientEngine:
    @staticmethod
    def evaluate_safety(product_ingredients: List[str], user_allergies: List[str], user_sensitivities: List[str], routine_time: str) -> Dict[str, Any]:
        score = 100
        alerts = []
        warnings = []
        status = "Safe"
        
        # Lowercase everything for matching
        lower_ingredients = [ing.lower() for ing in product_ingredients]
        lower_allergies = [a.lower() for a in user_allergies]
        lower_sensitivities = [s.lower() for s in user_sensitivities]
        
        # 1. Allergy Matching
        for ing in lower_ingredients:
            for allergy in lower_allergies:
                if allergy in ing or ing in allergy:
                    score -= 50
                    alerts.append(f"Allergy Alert: Contains {ing} which matches your allergy '{allergy}'.")
                    
            for sens in lower_sensitivities:
                if sens in ing or ing in sens:
                    score -= 20
                    warnings.append(f"Sensitivity Warning: Contains {ing} which matches your sensitivity '{sens}'.")
                    
        # 2. Chemical Conflict Matrix (Basic implementation)
        has_retinoid = any(any(r in ing for r in ["retinol", "retinoid", "tretinoin", "adapalene"]) for ing in lower_ingredients)
        has_aha_bha = any(any(a in ing for a in ["glycolic", "lactic", "salicylic", "aha", "bha"]) for ing in lower_ingredients)
        has_vit_c = any("vitamin c" in ing or "ascorbic" in ing for ing in lower_ingredients)
        
        if has_retinoid and has_aha_bha:
            score -= 40
            warnings.append("Conflict: Combining Retinoids with AHAs/BHAs can cause severe irritation.")
            
        if has_retinoid and has_vit_c:
            score -= 30
            warnings.append("Conflict: Combining Retinoids with Vitamin C can destabilize both and cause irritation.")
            
        if has_retinoid and routine_time.lower() == "morning":
            score -= 30
            warnings.append("Routine Warning: Retinoids degrade in sunlight and should be used in the evening.")
            
        if has_aha_bha and routine_time.lower() == "morning":
            warnings.append("Routine Note: AHAs/BHAs increase sun sensitivity. Ensure you use sunscreen.")
            
        score = max(0, min(100, score))
        
        if score >= 80:
            status = "Safe"
        elif score >= 50:
            status = "Warning"
        else:
            status = "Unsafe"
            
        return {
            "score": score,
            "status": status,
            "allergy_alerts": alerts,
            "interaction_warnings": warnings
        }
