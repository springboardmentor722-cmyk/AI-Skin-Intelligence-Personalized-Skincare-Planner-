class ConcernPrioritizationEngine:
    """
    Deterministic rule-based engine to prioritize skin concerns.
    No Machine Learning used.
    """
    
    @staticmethod
    def identify_skin_concerns(skin_type: str, primary_concern: str, secondary_concern: str, lifestyle_factors: dict, sensitivity: str) -> dict:
        """
        Prioritizes concerns based on rules. 
        Example Rules:
        - Acne is High Priority.
        - Pigmentation is Medium.
        - Dryness is Low unless skin_type is Dry, then Medium.
        """
        
        # Base severity mapping
        severity_map = {
            "Acne": "High",
            "Severe Acne": "High",
            "Pigmentation": "Medium",
            "Dark Spots": "Medium",
            "Dryness": "Low",
            "Wrinkles": "Medium",
            "Aging": "Medium",
            "Redness": "Medium"
        }
        
        primary_severity = severity_map.get(primary_concern, "Medium")
        secondary_severity = severity_map.get(secondary_concern, "Low")
        
        # Rule overrides
        if primary_concern == "Dryness" and skin_type == "Dry":
            primary_severity = "High"
            
        if sensitivity == "Sensitive" and primary_concern in ["Acne", "Pigmentation"]:
            # If sensitive skin has acne, it's highly severe because treatments are tricky
            primary_severity = "High"
            
        explanation = f"{primary_concern} has been designated as {primary_severity} priority based on your {skin_type} skin type."
        
        # Lifestyle modifiers
        if lifestyle_factors.get("stress_level") == "High" and primary_concern == "Acne":
            explanation += " High stress levels are known to exacerbate acne, elevating this priority."
            primary_severity = "High"
            
        return {
            "primary_concern": primary_concern,
            "priority": 1,
            "severity": primary_severity,
            "explanation": explanation,
            "secondary_concern": {
                "concern": secondary_concern,
                "priority": 2,
                "severity": secondary_severity
            }
        }
