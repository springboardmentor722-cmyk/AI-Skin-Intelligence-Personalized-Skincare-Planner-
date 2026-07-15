import uuid
from sqlalchemy.orm import Session
from app.models.decision_matrix import DecisionMatrix
from app.models.routine import SkincareRoutine, RoutineStep

class RoutineGenerator:
    """
    Deterministic rule-based Routine Generator.
    Queries the Decision Matrix to build personalized routines.
    """
    
    @staticmethod
    def generate_routine(session: Session, user_id: str, screening_id: str, skin_type: str, primary_concern: str, sensitivity: str) -> dict:
        """
        1. Queries the Decision Matrix
        2. Applies Sensitivity Overrides
        3. Saves to Database
        4. Returns Routine
        """
        
        # 1. Query Decision Matrix for closest match
        matrix_entry = session.query(DecisionMatrix).filter(
            DecisionMatrix.skin_type == skin_type,
            DecisionMatrix.primary_concern == primary_concern
        ).first()
        
        # Fallback if no exact match exists
        if not matrix_entry:
            matrix_entry = session.query(DecisionMatrix).filter(
                DecisionMatrix.skin_type == skin_type
            ).first()
            
        if not matrix_entry:
            raise ValueError(f"No routine template found for skin type {skin_type}")
            
        raw_template = matrix_entry.routine_template
        
        # 2. Apply Sensitivity Overrides & Fetch Products
        is_sensitive = (sensitivity.lower() == "sensitive")
        
        from app.models.product import Product
        
        def enrich_steps(steps: list) -> list:
            for step in steps:
                suggestion = step.get("ingredient_suggestion", "").lower()
                category = step.get("category", "")
                
                # Apply deterministic overrides for sensitive skin
                if is_sensitive:
                    if "retinol" in suggestion or "retinoid" in suggestion:
                        step["ingredient_suggestion"] = "Bakuchiol (Gentle Retinol Alternative)"
                        step["instructions"] += " (Adjusted for Sensitive Skin)"
                        suggestion = "bakuchiol"
                    elif "aha/bha peeling" in suggestion or "strong exfoliant" in suggestion:
                        step["ingredient_suggestion"] = "PHA / Lactic Acid (Gentle Exfoliant)"
                        step["instructions"] += " (Adjusted for Sensitive Skin)"
                        suggestion = "pha"
                
                # Try to fetch a matching product
                product = session.query(Product).filter(
                    Product.product_type.ilike(f"%{category}%"),
                    Product.skin_types.ilike(f"%{skin_type}%")
                ).first()
                
                if product:
                    step["product_suggestion"] = f"{product.brand} - {product.name}"
                else:
                    step["product_suggestion"] = f"Dermatologist Recommended {category}"
                    
            return steps
            
        morning_routine = enrich_steps(raw_template.get("morning", []))
        evening_routine = enrich_steps(raw_template.get("evening", []))
        weekly_routine = enrich_steps(raw_template.get("weekly", []))
        
        # 3. Save to Database
        # Create Routine Header
        routine = SkincareRoutine(
            user_id=user_id,
            screening_id=screening_id,
            is_active=True
        )
        session.add(routine)
        session.flush() # To get routine.id
        
        # Create Routine Steps
        for time_of_day, steps in [("Morning", morning_routine), ("Evening", evening_routine), ("Weekly", weekly_routine)]:
            for step_data in steps:
                step_obj = RoutineStep(
                    routine_id=routine.id,
                    time_of_day=time_of_day,
                    step_number=step_data.get("step"),
                    category=step_data.get("category"),
                    product_suggestion=step_data.get("product_suggestion"),
                    ingredient_suggestion=step_data.get("ingredient_suggestion"),
                    instructions=step_data.get("instructions")
                )
                session.add(step_obj)
                
        return {
            "routine_id": str(routine.id),
            "morning": morning_routine,
            "evening": evening_routine,
            "weekly": weekly_routine
        }
