"""Seed the database with demo accounts and the initial product/ingredient datasets.

Run from the backend/ folder:  python -m app.seed
Safe to re-run: it skips anything that already exists.
"""
import json
import random
from datetime import date, time, timedelta

from sqlalchemy import select

from .database import Base, SessionLocal, engine
from .models import (
    AvailabilitySlot, ConsultantProfile, DermatologistProfile, Ingredient,
    LifestyleLog, Product, ProductIngredient, ProgressEntry, Role, Routine,
    RoutineTemplate, SkinProfile, User,
)
from .services.routine_engine import DECISION_MATRIX
from .ingredient_kb import INGREDIENT_KB
from .product_catalog import PRODUCT_CATALOG
from .security import hash_password

DEMO_ACCOUNTS = [
    # email, password, name, role
    ("admin@lumen.app", "Admin@1234", "Ava Administrator", Role.ADMIN),
    ("user@lumen.app", "User@1234", "Priya Sharma", Role.USER),
    ("derm@lumen.app", "Derm@1234", "Dr. Ananya Bose", Role.DERMATOLOGIST),
    ("derm2@lumen.app", "Derm@1234", "Dr. Rohan Mehta", Role.DERMATOLOGIST),
    ("derm3@lumen.app", "Derm@1234", "Dr. Sarah Lin", Role.DERMATOLOGIST),
    ("consultant@lumen.app", "Consult@1234", "Meera Kapoor", Role.CONSULTANT),
    ("consultant2@lumen.app", "Consult@1234", "Daniel Reyes", Role.CONSULTANT),
]

DERM_DETAILS = {
    "derm@lumen.app": dict(qualification="MBBS, MD (Dermatology)", specialization="Acne, Pigmentation, Clinical Dermatology",
                            experience_years=12, clinic_name="GlowPoint Skin Clinic", location="Kolkata, WB",
                            languages="English, Hindi, Bengali", consultation_fee=800,
                            consultation_types="video,clinic",
                            bio="Board-certified dermatologist focused on evidence-based acne and pigmentation care."),
    "derm2@lumen.app": dict(qualification="MBBS, DDVL", specialization="Anti-aging, Laser, Cosmetic Dermatology",
                             experience_years=9, clinic_name="Lumina Aesthetics", location="Mumbai, MH",
                             languages="English, Hindi, Marathi", consultation_fee=1200,
                             consultation_types="video,clinic",
                             bio="Cosmetic dermatologist specialising in anti-aging protocols and laser therapy."),
    "derm3@lumen.app": dict(qualification="MD, FAAD", specialization="Sensitive Skin, Eczema, Pediatric Dermatology",
                             experience_years=15, clinic_name="ClearSky Dermatology", location="Bengaluru, KA",
                             languages="English, Mandarin", consultation_fee=1000,
                             consultation_types="video",
                             bio="Specialist in sensitive and reactive skin with a research background in barrier repair."),
}

CONSULTANT_DETAILS = {
    "consultant@lumen.app": dict(expertise="Routine planning, Sensitive skin, Diet & hydration",
                                  languages="English, Hindi",
                                  bio="Certified skincare consultant helping clients build sustainable routines."),
    "consultant2@lumen.app": dict(expertise="Anti-aging, Product analysis, Lifestyle coaching",
                                   languages="English, Spanish",
                                   bio="Ingredient nerd and lifestyle coach: routines that fit real schedules."),
}

INGREDIENTS = [
    ("Niacinamide", "Reduces inflammation, regulates oil, brightens tone, strengthens the skin barrier.", "Very high concentrations can cause flushing in sensitive skin."),
    ("Hyaluronic Acid", "Binds water for deep hydration and plumper-looking skin.", "Apply on damp skin; can pull moisture out in very dry climates without a sealing moisturizer."),
    ("Salicylic Acid", "Oil-soluble BHA that clears pores and treats blackheads and acne.", "Can dry or irritate; avoid combining with strong retinoids at first."),
    ("Retinol", "Boosts cell turnover and collagen; treats acne and fine lines.", "Causes purging and sun sensitivity; not recommended during pregnancy."),
    ("Vitamin C", "Antioxidant that brightens, fades dark spots, and defends against pollution.", "Unstable; can sting sensitive skin. Store away from light."),
    ("Ceramides", "Rebuild the lipid barrier, lock in moisture, calm reactive skin.", "None significant."),
    ("Glycolic Acid", "AHA that exfoliates dead cells for smoother, brighter skin.", "Increases sun sensitivity; start at low concentration."),
    ("Azelaic Acid", "Treats acne, rosacea, and post-inflammatory pigmentation gently.", "Mild itching possible in the first week."),
    ("Zinc Oxide", "Broad-spectrum mineral UV filter; calming for sensitive skin.", "Can leave a white cast on deeper skin tones."),
    ("Centella Asiatica", "Soothes irritation, supports healing and hydration.", "None significant."),
    ("Squalane", "Lightweight moisturizer that mimics the skin's own sebum.", "None significant."),
    ("Benzoyl Peroxide", "Kills acne-causing bacteria and reduces inflammation.", "Bleaches fabric; can be drying — buffer with moisturizer."),
]

PRODUCTS = [
    ("Gentle Foam Cleanser", "DermaPure", "cleanser", 399, "budget", "all", "Low-pH gel cleanser that removes buildup without stripping.", ["Centella Asiatica", "Glycolic Acid"]),
    ("HydraBoost Water Gel", "AquaLab", "moisturizer", 549, "budget", "oily,combination,normal", "Featherweight gel moisturizer with humectant hydration.", ["Hyaluronic Acid", "Niacinamide"]),
    ("Barrier Repair Cream", "CeraDerm", "moisturizer", 899, "budget", "dry,sensitive", "Rich ceramide cream that rebuilds a compromised barrier.", ["Ceramides", "Squalane"]),
    ("10% Niacinamide Serum", "TrueForm", "serum", 650, "budget", "all", "Brightening and pore-refining daily serum.", ["Niacinamide", "Hyaluronic Acid"]),
    ("2% BHA Liquid Exfoliant", "ClearPath", "exfoliant", 1150, "premium", "oily,combination", "Leave-on salicylic acid that unclogs pores and smooths texture.", ["Salicylic Acid"]),
    ("Retinol 0.3% Night Serum", "NovaSkin", "serum", 1490, "premium", "normal,combination,oily", "Encapsulated retinol for gradual, low-irritation renewal.", ["Retinol", "Squalane"]),
    ("Vitamin C 15% Brightening Drops", "LumenCare", "serum", 1890, "premium", "all", "Stabilised L-ascorbic acid with ferulic support for radiance.", ["Vitamin C"]),
    ("Azelaic 10% Calming Cream", "RosaCalm", "treatment", 980, "budget", "sensitive,combination", "Multi-tasker for redness, bumps, and marks.", ["Azelaic Acid", "Centella Asiatica"]),
    ("Mineral Shield SPF 50", "SunHalo", "sunscreen", 799, "budget", "all", "Zinc-based broad-spectrum sunscreen, no white flash formula.", ["Zinc Oxide", "Niacinamide"]),
    ("Overnight Recovery Mask", "MoonVeil", "mask", 2100, "premium", "dry,normal", "Sleeping mask that floods skin with lipids and humectants.", ["Ceramides", "Hyaluronic Acid", "Squalane"]),
    ("Spot Rescue Gel", "ClearPath", "treatment", 450, "budget", "oily,combination", "Targeted benzoyl peroxide gel for active breakouts.", ["Benzoyl Peroxide"]),
    ("Glow Tonic 7% AHA", "LumenCare", "exfoliant", 1350, "premium", "normal,combination", "Weekly resurfacing toner for glass-smooth texture.", ["Glycolic Acid"]),
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        users: dict[str, User] = {}
        for email, password, name, role in DEMO_ACCOUNTS:
            user = db.scalar(select(User).where(User.email == email))
            if not user:
                user = User(email=email, password_hash=hash_password(password),
                            full_name=name, role=role, is_verified=True)
                db.add(user)
                db.flush()
            users[email] = user

        # Patient skin profile + lifestyle + progress history
        patient = users["user@lumen.app"]
        if not db.scalar(select(SkinProfile).where(SkinProfile.user_id == patient.id)):
            db.add(SkinProfile(
                user_id=patient.id, age=27, gender="female", skin_type="combination",
                skin_tone="medium", concerns="acne, pigmentation, occasional dryness",
                allergies="fragrance", sensitivities="strong AHAs",
                medical_history="none", current_products="gel cleanser, SPF 50",
                goals="clear acne within 3 months, even skin tone",
            ))
        if not db.scalar(select(ProgressEntry).where(ProgressEntry.user_id == patient.id)):
            random.seed(7)
            score, hydration, acne, pigment = 58, 52, 7, 6
            for weeks_ago in range(11, -1, -1):
                entry_date = date.today() - timedelta(weeks=weeks_ago)
                score = min(96, score + random.randint(0, 4))
                hydration = min(95, hydration + random.randint(0, 4))
                acne = max(1, acne - random.choice([0, 0, 1]))
                pigment = max(1, pigment - random.choice([0, 1]))
                db.add(ProgressEntry(user_id=patient.id, entry_date=entry_date, skin_score=score,
                                     hydration=hydration, acne_level=acne, pigmentation_level=pigment))
        if not db.scalar(select(LifestyleLog).where(LifestyleLog.user_id == patient.id)):
            random.seed(11)
            for days_ago in range(6, -1, -1):
                db.add(LifestyleLog(
                    user_id=patient.id, log_date=date.today() - timedelta(days=days_ago),
                    sleep_hours=round(random.uniform(6, 8.5), 1),
                    water_intake_l=round(random.uniform(1.5, 3.2), 1),
                    exercise_minutes=random.choice([0, 20, 30, 45]),
                    stress_level=random.randint(2, 7),
                    environment_exposure=random.choice(["low", "moderate", "high"]),
                ))

        # Dermatologist profiles + weekly availability
        for email, details in DERM_DETAILS.items():
            derm = users[email]
            profile = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == derm.id))
            if not profile:
                profile = DermatologistProfile(user_id=derm.id, is_approved=True, **details)
                db.add(profile)
                db.flush()
                for day in (0, 1, 2, 3, 4):  # Mon–Fri
                    db.add(AvailabilitySlot(dermatologist_id=profile.id, day_of_week=day,
                                            start_time=time(10, 0), end_time=time(13, 0), slot_minutes=30))
                    db.add(AvailabilitySlot(dermatologist_id=profile.id, day_of_week=day,
                                            start_time=time(17, 0), end_time=time(20, 0), slot_minutes=30))
                db.add(AvailabilitySlot(dermatologist_id=profile.id, day_of_week=5,  # Saturday morning
                                        start_time=time(10, 0), end_time=time(12, 0), slot_minutes=30))

        # Consultant profiles
        for email, details in CONSULTANT_DETAILS.items():
            consultant = users[email]
            if not db.scalar(select(ConsultantProfile).where(ConsultantProfile.user_id == consultant.id)):
                db.add(ConsultantProfile(user_id=consultant.id, is_approved=True, **details))

        # Starter routine for the demo patient
        if not db.scalar(select(Routine).where(Routine.patient_id == patient.id)):
            db.add(Routine(
                patient_id=patient.id, consultant_id=users["consultant@lumen.app"].id,
                title="Clear & Calm Starter Routine",
                morning_steps=json.dumps(["Gentle Foam Cleanser", "10% Niacinamide Serum",
                                          "HydraBoost Water Gel", "Mineral Shield SPF 50"]),
                night_steps=json.dumps(["Gentle Foam Cleanser", "Azelaic 10% Calming Cream",
                                        "Barrier Repair Cream"]),
                weekly_steps=json.dumps(["2% BHA Liquid Exfoliant (2x per week, night)",
                                         "Overnight Recovery Mask (1x per week)"]),
                lifestyle_advice="Target 7.5h sleep and 2.5L water daily. Change pillowcase twice a week.",
            ))

        # Ingredient + product datasets
        ingredient_by_name: dict[str, Ingredient] = {}
        for name, benefits, cautions in INGREDIENTS:
            ing = db.scalar(select(Ingredient).where(Ingredient.name == name))
            if not ing:
                ing = Ingredient(name=name, benefits=benefits, cautions=cautions)
                db.add(ing)
                db.flush()
            ingredient_by_name[name] = ing

        # ---- Milestone 3, Part 2: enrich / add ingredient knowledge base ----
        for (kname, sci_cat, kdesc, kbenefits, side_fx, st_compat, cc_compat,
             comedo, refs) in INGREDIENT_KB:
            ing = db.scalar(select(Ingredient).where(Ingredient.name == kname))
            if not ing:
                ing = Ingredient(name=kname, benefits=kbenefits)
                db.add(ing)
                db.flush()
                ingredient_by_name[kname] = ing
            ing.description = kdesc
            ing.scientific_category = sci_cat
            ing.side_effects = side_fx
            ing.skin_type_compat = st_compat
            ing.concern_compat = cc_compat
            ing.comedogenic_rating = comedo
            ing.references = refs
            if not ing.benefits:
                ing.benefits = kbenefits
            ing.source = "curated-kb"

        # ---- Milestone 3, Part 1: seed the comprehensive product catalogue ----
        # Each product links to the ingredient knowledge base by name, so skin-type
        # / concern compatibility and per-ingredient benefits are auto-derived,
        # while explicit usage / warnings / contraindications / image / rating come
        # straight from the curated catalogue entry.
        def ensure_ingredient(nm: str):
            """Return an Ingredient row for a key ingredient, creating a stub if the
            KB somehow lacks it (keeps foreign keys valid for any catalogue entry)."""
            ing = ingredient_by_name.get(nm) or db.scalar(
                select(Ingredient).where(Ingredient.name == nm))
            if not ing:
                ing = Ingredient(name=nm, source="catalog-stub")
                db.add(ing)
                db.flush()
                ingredient_by_name[nm] = ing
            return ing

        for (name, brand, category, price, tier, description, key_ings,
             usage_time, warnings, contraindications, image_url,
             rating, review_count) in PRODUCT_CATALOG:
            product = db.scalar(select(Product).where(
                Product.name == name, Product.brand == brand))
            if product:
                continue

            # Derive skin-type / concern compatibility + benefits from the KB.
            st_set, cc_set, benefits_bits, full_inci = set(), set(), [], []
            for ing_name in key_ings:
                kb = ensure_ingredient(ing_name)
                if kb.skin_type_compat:
                    st_set.update(x for x in kb.skin_type_compat.split(",") if x)
                if kb.concern_compat:
                    cc_set.update(x for x in kb.concern_compat.split(",") if x)
                if kb.benefits:
                    benefits_bits.append(f"{ing_name}: {kb.benefits}")
                full_inci.append(ing_name)

            suitable = ",".join(sorted(st_set)) if st_set else "all"
            product = Product(
                name=name, brand=brand, category=category, price=price,
                tier=tier, suitable_for=suitable, description=description,
                skin_type_compat=",".join(sorted(st_set)) or None,
                concern_compat=",".join(sorted(cc_set)) or None,
                key_ingredients=", ".join(key_ings),
                ingredient_list=", ".join(full_inci),
                ingredient_benefits=" | ".join(benefits_bits) or None,
                usage_time=usage_time,
                warnings=warnings,
                contraindications=contraindications,
                image_url=image_url,
                rating=rating,
                review_count=review_count,
                external_id=f"seed:{brand}:{name}".lower().replace(" ", "-"),
                source="seed",
            )
            db.add(product)
            db.flush()
            for ing_name in key_ings:
                link = ProductIngredient(product_id=product.id,
                                         ingredient_id=ensure_ingredient(ing_name).id)
                db.add(link)

        # ---- Milestone 2: seed the decision matrix (skin type -> steps) ----
        for skin_type, phases in DECISION_MATRIX.items():
            for phase, steps in phases.items():
                exists = db.scalar(select(RoutineTemplate).where(
                    RoutineTemplate.skin_type == skin_type,
                    RoutineTemplate.time_of_day == phase))
                if not exists:
                    db.add(RoutineTemplate(skin_type=skin_type, time_of_day=phase,
                                           steps=json.dumps(steps)))

        db.commit()
        print("Seed complete.")
        print("Milestone 2 decision matrix seeded: %d skin types x 4 phases."
              % len(DECISION_MATRIX))
        print("Demo accounts (email / password):")
        for email, password, name, role in DEMO_ACCOUNTS:
            print(f"  [{role:<13}] {email}  /  {password}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
