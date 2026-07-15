from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from app.schemas.routine import Routine, RoutineStep, ProductRecommendation
from app.services.user_profile import user_profile_service
from app.services.skin_screening import skin_screening_service

class RoutineService:
    def generate_routine(self, db: Session, user_id: UUID) -> Routine:
        # Fetch skin profile
        skin_profile = None
        try:
            from app.models.profile import SkinProfile
            skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        except HTTPException:
            pass
            
        is_oily = skin_profile and skin_profile.skin_type and skin_profile.skin_type.lower() == 'oily'
        
        concerns_lower = []
        try:
            screening = skin_screening_service.get_latest_screening(db, user_id)
            if screening.primary_concern:
                concerns_lower.append(screening.primary_concern.lower())
            if screening.secondary_concern:
                concerns_lower.append(screening.secondary_concern.lower())
        except Exception:
            pass

        # Morning Routine Generation
        morning = []
        step_idx = 1
        
        # 1. Cleanser
        cleanser_desc = "Cleanses without stripping moisture"
        cleanser_name = "Gentle Cleanser"
        if is_oily or "acne" in concerns_lower or "oily skin" in concerns_lower:
            cleanser_name = "Salicylic Acid Foaming Cleanser"
            cleanser_desc = "Deep cleans pores, controls oil, and treats breakouts."
        elif "dry skin" in concerns_lower or "sensitive skin" in concerns_lower:
            cleanser_name = "Hydrating Milk Cleanser"
            cleanser_desc = "Gently cleanses while protecting the skin barrier."
            
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=cleanser_name, description=cleanser_desc, product_type="Cleanser"),
            instructions="Wash face gently with warm water."
        ))
        step_idx += 1

        # 2. Treatment
        treatment_name = "Vitamin C 15% Serum"
        treatment_desc = "Provides antioxidant protection against environmental stressors."
        if "acne" in concerns_lower:
            treatment_name = "Niacinamide 10% + Zinc 1%"
            treatment_desc = "Reduces blemishes, congestion, and regulates sebum."
        elif "hyperpigmentation" in concerns_lower or "dark spots" in concerns_lower or "uneven skin tone" in concerns_lower:
            treatment_name = "Alpha Arbutin & Vitamin C Serum"
            treatment_desc = "Targets dark spots and brightens overall complexion."
        elif "redness" in concerns_lower:
            treatment_name = "Azelaic Acid Suspension"
            treatment_desc = "Reduces redness and soothes irritated skin."
            
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=treatment_name, description=treatment_desc, product_type="Treatment"),
            instructions="Apply 3-4 drops and pat gently into skin."
        ))
        step_idx += 1

        # 3. Moisturizer
        moist_name = "Lightweight Ceramide Lotion"
        moist_desc = "Hydrates and maintains the skin barrier."
        if is_oily:
            moist_name = "Oil-Free Gel Moisturizer"
            moist_desc = "Provides weightless hydration without clogging pores."
        elif "dry skin" in concerns_lower:
            moist_name = "Intense Hydration Cream"
            moist_desc = "Deeply nourishes and locks in moisture."
            
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=moist_name, description=moist_desc, product_type="Moisturizer"),
            instructions="Apply evenly over face and neck."
        ))
        step_idx += 1

        # 4. Sunscreen
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(
                name="SPF 50+ Sunscreen",
                description="Critical protection against UVA and UVB rays.",
                product_type="Sun Protection"
            ),
            instructions="Apply generously as the final step."
        ))

        # Evening Routine Generation
        evening = []
        step_idx = 1
        
        # 1. First Cleanse (Makeup/SPF Removal)
        evening.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(
                name="Cleansing Balm or Oil",
                description="Breaks down SPF and makeup effectively.",
                product_type="Cleanser"
            ),
            instructions="Massage onto dry skin, then rinse."
        ))
        step_idx += 1

        # 2. Second Cleanse
        evening.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(
                name=cleanser_name,
                description="Second cleanse to ensure pores are entirely clear.",
                product_type="Cleanser"
            ),
            instructions="Wash face to remove remaining impurities."
        ))
        step_idx += 1

        # 3. Night Treatment
        night_treatment = "Retinol 0.3% Cream"
        night_desc = "Accelerates cell turnover and boosts collagen production."
        if "acne" in concerns_lower:
            night_treatment = "BHA 2% Liquid Exfoliant"
            night_desc = "Unclogs pores and removes dead skin cells."
        elif "dry skin" in concerns_lower or "sensitive skin" in concerns_lower:
            night_treatment = "Hyaluronic Acid 2% + B5"
            night_desc = "Draws moisture into the skin for deep hydration."
        elif "wrinkles" in concerns_lower or "fine lines" in concerns_lower:
            night_treatment = "Retinol 1% or Bakuchiol"
            night_desc = "Targets fine lines and signs of aging."
            
        evening.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=night_treatment, description=night_desc, product_type="Treatment"),
            instructions="Apply a pea-sized amount avoiding the eye area."
        ))
        step_idx += 1

        # 4. Night Moisturizer
        night_moist = "Rich Recovery Cream"
        night_moist_desc = "Deeply nourishes skin overnight."
        if is_oily or "acne" in concerns_lower:
            night_moist = "Lightweight Gel Cream"
            night_moist_desc = "Hydrates while letting skin breathe."
            
        evening.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=night_moist, description=night_moist_desc, product_type="Moisturizer"),
            instructions="Apply evenly to seal in the treatment."
        ))

        return Routine(morning_routine=morning, evening_routine=evening)

routine_service = RoutineService()
