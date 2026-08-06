from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    Appointment,
    User,
    ConsultantRecommendation,
    Notification,
    DermatologistTreatment,
    SkinProfile,
    Lifestyle,
    SkinAssessment,
)

from app.schemas import (
    ConsultantRecommendationCreate,
    DermatologistTreatmentCreate,
)

router = APIRouter(
    prefix="/dermatologist",
    tags=["Dermatologist"],
)

@router.get("/appointments")
def get_dermatologist_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointments = (
    db.query(Appointment)
    .filter(
        Appointment.status == "APPROVED",
        Appointment.dermatologist_id == current_user.id
    )
    .order_by(Appointment.appointment_date.desc())
    .all()
)

    result = []

    for appointment in appointments:

        recommendation = (
    db.query(ConsultantRecommendation)
    .filter(
        ConsultantRecommendation.user_id == appointment.user_id,
        ConsultantRecommendation.recommend_dermatologist == True,
    )
    .order_by(ConsultantRecommendation.created_at.desc())
    .first()
)

        if recommendation:

            patient = (
                db.query(User)
                .filter(User.id == appointment.user_id)
                .first()
            )

            treatment = (
                db.query(DermatologistTreatment)
                .filter(
                DermatologistTreatment.appointment_id == appointment.id
    )
    .first()
)

# Skip completed treatments
        if treatment:
         continue

        result.append({
    "appointment_id": appointment.id,
    "patient_name": patient.full_name,
    "email": patient.email,
    "appointment_date": appointment.appointment_date,
    "consultant_recommendation": recommendation.recommendation,
    "status": "PENDING",

    "consultant_name":
        appointment.consultant.full_name
        if appointment.consultant
        else "Not Assigned",
})
    return result

@router.get("/patients")
def get_dermatologist_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointments = (
    db.query(Appointment)
    .filter(
        Appointment.status == "APPROVED",
        Appointment.dermatologist_id == current_user.id
    )
    .order_by(Appointment.appointment_date.desc())
    .all()
)
    result = []

    for appointment in appointments:

        recommendation = (
            db.query(ConsultantRecommendation)
            .filter(
                ConsultantRecommendation.user_id == appointment.user_id,
                ConsultantRecommendation.recommend_dermatologist == True,
            )
            .order_by(
                ConsultantRecommendation.created_at.desc()
            )
            .first()
        )

        if not recommendation:
            continue

        patient = (
            db.query(User)
            .filter(User.id == appointment.user_id)
            .first()
        )

        treatment = (
            db.query(DermatologistTreatment)
            .filter(
                DermatologistTreatment.appointment_id == appointment.id
            )
            .first()
        )

        result.append({
    "appointment_id": appointment.id,
    "patient_name": patient.full_name,
    "email": patient.email,
    "appointment_date": appointment.appointment_date,
    "status": "COMPLETED" if treatment else "PENDING",

    "consultant_name":
        appointment.consultant.full_name
        if appointment.consultant
        else "Not Assigned",

    "follow_up_date":
        treatment.follow_up_date if treatment else None,
})
    return result

@router.get("/dashboard")
def dermatologist_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # Total patients assigned to this dermatologist
    total_cases = (
        db.query(DermatologistTreatment.user_id)
        .filter(
            DermatologistTreatment.dermatologist_id == current_user.id
        )
        .distinct()
        .count()
    )

    # Patients waiting for treatment
    pending_cases = len(get_dermatologist_appointments(db, current_user))

    # Treatments created by this dermatologist
    completed_cases = (
        db.query(DermatologistTreatment)
        .filter(
            DermatologistTreatment.dermatologist_id == current_user.id
        )
        .count()
    )

    # Unread notifications
    notifications = (
        db.query(Notification)
        .filter(
            Notification.dermatologist_id == current_user.id,
            Notification.is_read == False,
        )
        .count()
    )

    return {
        "total_cases": total_cases + pending_cases,
        "pending_cases": pending_cases,
        "completed_cases": completed_cases,
        "notifications": notifications,
    }

@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.dermatologist_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .limit(10)
        .all()
    )

    activities = []

    for notification in notifications:

        patient_name = "Unknown Patient"

        if notification.appointment_id:

            appointment = (
                db.query(Appointment)
                .filter(Appointment.id == notification.appointment_id)
                .first()
            )

            if appointment:

                patient = (
                    db.query(User)
                    .filter(User.id == appointment.user_id)
                    .first()
                )

                if patient:
                    patient_name = patient.full_name

        activities.append({
            "title": notification.title,
            "patient_name": patient_name,
            "description": notification.message,
            "time": notification.created_at,
        })

    return activities

@router.get("/patient/{appointment_id}")
def get_patient_details(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    user = (
        db.query(User)
        .filter(User.id == appointment.user_id)
        .first()
    )

    skin_profile = (
        db.query(SkinProfile)
        .filter(SkinProfile.user_id == user.id)
        .first()
    )

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user.id)
        .first()
    )

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )

    recommendation = (
        db.query(ConsultantRecommendation)
        .filter(
            ConsultantRecommendation.user_id == user.id
        )
        .order_by(
            ConsultantRecommendation.created_at.desc()
        )
        .first()
    )

    treatment = (
        db.query(DermatologistTreatment)
        .filter(
             DermatologistTreatment.appointment_id == appointment.id
    )
        .first()
)

    return {

    "patient": user,

    "skin_profile": skin_profile,

    "lifestyle": lifestyle,

    "assessment": assessment,

    "recommendation": recommendation,

    "treatment": treatment,

}



@router.post("/treatment/{appointment_id}")
def save_treatment(
    appointment_id: int,
    treatment: DermatologistTreatmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    # Save dermatologist treatment
    new_treatment = DermatologistTreatment(
        appointment_id=appointment.id,
        user_id=appointment.user_id,
        dermatologist_id=current_user.id,
        diagnosis=treatment.diagnosis,
        medicines=treatment.medicines,
        morning_routine=treatment.morning_routine,
        night_routine=treatment.night_routine,
        lifestyle_advice=treatment.lifestyle_advice,
        follow_up_date=treatment.follow_up_date,
    )

    db.add(new_treatment)

    # Mark latest consultant recommendation as completed
    recommendation = (
        db.query(ConsultantRecommendation)
        .filter(
            ConsultantRecommendation.user_id == appointment.user_id,
            ConsultantRecommendation.status == "PENDING",
        )
        .order_by(
            ConsultantRecommendation.created_at.desc()
        )
        .first()
    )

    if recommendation:
        recommendation.status = "COMPLETED"

    # Create notification for patient
    notification = Notification(
        user_id=appointment.user_id,
        appointment_id=appointment.id,
        title="Treatment Plan Ready",
        message="Your dermatologist has completed your treatment plan. Please check My Treatments.",
    )

    db.add(notification)

    db.commit()

    return {
        "message": "Treatment saved successfully."
    }