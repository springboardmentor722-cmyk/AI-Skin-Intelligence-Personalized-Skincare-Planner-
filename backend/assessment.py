from sqlalchemy.orm import Session
from backend.models import SkinProfile, RoutineStepMatrix, SkincareRoutine

def identify_skin_concerns(concerns_text: str):
    """
    Parse the user's self-reported concerns and rank them by severity.
    Returns a list of dicts: [{"concern": "acne", "severity": "High"}, ...]
    """
    if not concerns_text:
        return []
    
    concerns = [c.strip().lower() for c in concerns_text.split(",") if c.strip()]
    ranked = []
    
    for concern in concerns:
        if any(word in concern for word in ["severe", "active", "flare", "cystic", "painful", "excessive"]):
            severity = "High"
        elif any(word in concern for word in ["moderate", "persistent", "occasional", "some"]):
            severity = "Medium"
        else:
            severity = "Low"
        ranked.append({"concern": concern, "severity": severity})
    
    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    ranked.sort(key=lambda x: severity_order[x["severity"]])
    return ranked


def generate_routine(db: Session, user_id: int, skin_type: str, assessment_id: int):
    """
    Generate AM/PM/Weekly routine steps from the seeded matrix.
    Includes safety override for sensitive skin (removes harsh steps).
    Deletes any existing routines for this user first to avoid duplicates.
    """
    # Delete any existing routines for this user to prevent duplicates
    db.query(SkincareRoutine).filter(SkincareRoutine.user_id == user_id).delete()
    db.commit()

    # Fetch all steps for this skin type
    steps = db.query(RoutineStepMatrix).filter(
        RoutineStepMatrix.skin_type == skin_type
    ).order_by(RoutineStepMatrix.time_of_day, RoutineStepMatrix.step_order).all()
    
    if not steps:
        # Fallback if no matching skin type
        steps = db.query(RoutineStepMatrix).filter(
            RoutineStepMatrix.skin_type == "Normal"
        ).order_by(RoutineStepMatrix.time_of_day, RoutineStepMatrix.step_order).all()
    
    if not steps:
        return []
    
    # Safety override: if skin is sensitive, remove harsh steps
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    is_sensitive = profile and profile.skin_type == "Sensitive"
    
    generated = []
    step_counters = {"AM": 0, "PM": 0, "Weekly": 0}
    
    for step in steps:
        # Skip harsh steps for sensitive skin
        if is_sensitive and step.is_harsh:
            continue
        
        time_of_day = step.time_of_day
        step_counters[time_of_day] += 1
        
        generated.append({
            "time_of_day": time_of_day,
            "step_number": step_counters[time_of_day],
            "step_category": step.step_category,
            "step_description": step.step_description,
            "is_active": True,
        })
    
    return generated