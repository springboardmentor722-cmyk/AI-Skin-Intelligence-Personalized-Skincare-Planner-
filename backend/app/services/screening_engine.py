from typing import Dict, Any

class SkinScreeningEngine:
    """
    Deterministic rule-based engine to read and normalize skin screening data.
    """
    
    @staticmethod
    def process_screening(user_profile: dict, lifestyle: dict, concerns: dict, goals: dict) -> Dict[str, Any]:
        """
        Reads all disparate data points and normalizes them into a single evaluation object.
        """
        
        # 1. Normalize Skin Type
        skin_type = user_profile.get("skin_type", "Normal")
        
        # 2. Normalize Lifestyle
        # Convert sleep hours to a normalized metric
        sleep_hours = lifestyle.get("sleep_hours", 7)
        if sleep_hours < 5:
            sleep_quality = "Poor"
        elif 5 <= sleep_hours <= 6:
            sleep_quality = "Fair"
        else:
            sleep_quality = "Good"
            
        water_intake = lifestyle.get("water_intake_liters", 2.0)
        hydration_status = "Dehydrated" if water_intake < 1.5 else "Hydrated"
        
        stress_level = lifestyle.get("stress_level", "Medium")
        
        # 3. Compile the Normalized Object
        normalized_data = {
            "user_id": user_profile.get("user_id"),
            "base_profile": {
                "skin_type": skin_type,
                "sensitivity": user_profile.get("sensitivity", "Resilient"),
            },
            "concerns_profile": {
                "primary": concerns.get("primary_concern", "None"),
                "secondary": concerns.get("secondary_concern", "None")
            },
            "lifestyle_factors": {
                "sleep_quality": sleep_quality,
                "hydration_status": hydration_status,
                "stress_level": stress_level
            },
            "goals": goals
        }
        
        return normalized_data
