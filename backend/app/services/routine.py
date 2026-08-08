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
        
        concerns_str = ""
        try:
            screening = skin_screening_service.get_latest_screening(db, user_id)
            if screening.primary_concern:
                concerns_str += screening.primary_concern.lower() + " "
            if screening.secondary_concern:
                concerns_str += screening.secondary_concern.lower() + " "
        except Exception:
            pass

        # Morning Routine Generation
        morning = []
        step_idx = 1
        
        # 1. Cleanser
        cleanser_desc = "Cleanses without stripping moisture"
        cleanser_name = "Gentle Cleanser"
        recovery = "Maintains a healthy skin barrier by removing impurities gently."
        
        if "acne" in concerns_str or "breakout" in concerns_str:
            cleanser_name = "Salicylic Acid Foaming Cleanser"
            cleanser_desc = "Deep cleans pores, controls oil, and treats breakouts."
            recovery = "The BHA actively penetrates pores to dissolve the sebum and dead skin cells causing your acne."
        elif is_oily or "oily" in concerns_str:
            cleanser_name = "Oil-Control Gel Cleanser"
            cleanser_desc = "Removes excess sebum without drying."
            recovery = "Balances sebum production to prevent daytime shine."
        elif "dry" in concerns_str or "sensitive" in concerns_str:
            cleanser_name = "Hydrating Milk Cleanser"
            cleanser_desc = "Gently cleanses while protecting the skin barrier."
            recovery = "Helps repair your compromised barrier by adding moisture back during cleansing."
            
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=cleanser_name, description=cleanser_desc, product_type="Cleanser"),
            instructions="Wash face gently with warm water.",
            recovery_details=recovery
        ))
        step_idx += 1

        # 2. Treatment
        treatment_name = "Vitamin C 15% Serum"
        treatment_desc = "Provides antioxidant protection against environmental stressors."
        recovery = "Fights free radicals and brightens overall complexion."
        
        if "acne" in concerns_str or "breakout" in concerns_str:
            treatment_name = "Niacinamide 10% + Zinc 1%"
            treatment_desc = "Reduces blemishes, congestion, and regulates sebum."
            recovery = "Niacinamide reduces the severe inflammation from active breakouts and fades post-acne marks."
        elif "hyperpigmentation" in concerns_str or "dark spot" in concerns_str or "uneven" in concerns_str:
            treatment_name = "Alpha Arbutin & Vitamin C Serum"
            treatment_desc = "Targets dark spots and brightens overall complexion."
            recovery = "Inhibits melanin production to fade your specific dark spots over time."
        elif "redness" in concerns_str:
            treatment_name = "Azelaic Acid Suspension"
            treatment_desc = "Reduces redness and soothes irritated skin."
            recovery = "Directly targets the redness and inflammation detected in your scan."
            
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=treatment_name, description=treatment_desc, product_type="Treatment"),
            instructions="Apply 3-4 drops and pat gently into skin.",
            recovery_details=recovery
        ))
        step_idx += 1

        # 3. Moisturizer
        moist_name = "Lightweight Ceramide Lotion"
        moist_desc = "Hydrates and maintains the skin barrier."
        recovery = "Replenishes essential lipids for a healthy barrier."
        
        if "acne" in concerns_str or "breakout" in concerns_str or is_oily:
            moist_name = "Oil-Free Gel Moisturizer"
            moist_desc = "Provides weightless hydration without clogging pores."
            recovery = "Ensures your skin stays hydrated without contributing to further acne congestion."
        elif "dry" in concerns_str:
            moist_name = "Intense Hydration Cream"
            moist_desc = "Deeply nourishes and locks in moisture."
            recovery = "Provides a thick occlusive layer to heal severe dryness and prevent transepidermal water loss."
            
        morning.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=moist_name, description=moist_desc, product_type="Moisturizer"),
            instructions="Apply evenly over face and neck.",
            recovery_details=recovery
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
            instructions="Apply generously as the final step.",
            recovery_details="Crucial for preventing UV damage that worsens acne scars, hyperpigmentation, and aging."
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
            instructions="Massage onto dry skin, then rinse.",
            recovery_details="Ensures all sunscreen and impurities are melted away to prevent nighttime breakouts."
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
            instructions="Wash face to remove remaining impurities.",
            recovery_details="Removes the residue of the oil cleanser and treats the skin."
        ))
        step_idx += 1

        # 3. Night Treatment
        night_treatment = "Retinol 0.3% Cream"
        night_desc = "Accelerates cell turnover and boosts collagen production."
        recovery = "Helps skin renew itself overnight for a smoother texture."
        
        if "acne" in concerns_str or "breakout" in concerns_str:
            night_treatment = "BHA 2% Liquid Exfoliant"
            night_desc = "Unclogs pores and removes dead skin cells."
            recovery = "Works deeply inside the pore overnight to dissolve the blockages causing your acne."
        elif "dry" in concerns_str or "sensitive" in concerns_str:
            night_treatment = "Hyaluronic Acid 2% + B5"
            night_desc = "Draws moisture into the skin for deep hydration."
            recovery = "Binds water to your skin cells to repair dryness while you sleep."
        elif "wrinkle" in concerns_str or "fine line" in concerns_str:
            night_treatment = "Retinol 1% or Bakuchiol"
            night_desc = "Targets fine lines and signs of aging."
            recovery = "Stimulates collagen production to actively reduce the fine lines detected."
            
        evening.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=night_treatment, description=night_desc, product_type="Treatment"),
            instructions="Apply a pea-sized amount avoiding the eye area.",
            recovery_details=recovery
        ))
        step_idx += 1

        # 4. Night Moisturizer
        night_moist = "Rich Recovery Cream"
        night_moist_desc = "Deeply nourishes skin overnight."
        recovery = "Seals in your treatment and repairs the skin barrier."
        
        if "acne" in concerns_str or "breakout" in concerns_str or is_oily:
            night_moist = "Lightweight Gel Cream"
            night_moist_desc = "Hydrates while letting skin breathe."
            recovery = "Provides essential water-based hydration without oils that could trigger acne."
            
        evening.append(RoutineStep(
            step_number=step_idx,
            product=ProductRecommendation(name=night_moist, description=night_moist_desc, product_type="Moisturizer"),
            instructions="Apply evenly to seal in the treatment.",
            recovery_details=recovery
        ))

        # Save to database
        from app.models.routine import SkincareRoutine, RoutineStep as DBRoutineStep
        
        # Check if an active routine exists and archive it
        existing = db.query(SkincareRoutine).filter(
            SkincareRoutine.user_id == user_id, 
            SkincareRoutine.is_active == True
        ).first()
        if existing:
            existing.is_active = False
            existing.status = "ARCHIVED"
            
        db_routine = SkincareRoutine(
            user_id=user_id,
            screening_id=screening.id if 'screening' in locals() and screening else None,
            status="ACTIVE",
            is_active=True
        )
        db.add(db_routine)
        db.flush()
        
        for step in morning:
            db_step = DBRoutineStep(
                routine_id=db_routine.id,
                time_of_day="Morning",
                step_number=step.step_number,
                category=step.product.product_type,
                product_suggestion=step.product.name,
                instructions=step.instructions
            )
            db.add(db_step)
            
        for step in evening:
            db_step = DBRoutineStep(
                routine_id=db_routine.id,
                time_of_day="Evening",
                step_number=step.step_number,
                category=step.product.product_type,
                product_suggestion=step.product.name,
                instructions=step.instructions
            )
            db.add(db_step)
            
        db.commit()

        return Routine(morning_routine=morning, evening_routine=evening)

routine_service = RoutineService()
