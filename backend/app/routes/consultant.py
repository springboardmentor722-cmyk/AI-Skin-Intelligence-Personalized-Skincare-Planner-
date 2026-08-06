from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    Appointment,
    User,
    SkinProfile,
    Lifestyle,
    SkinAssessment,
    ProgressTracking,
)
from app.schemas import ConsultantReview
from app.models import Notification

router = APIRouter(
    prefix="/consultant",
    tags=["Consultant"],
)

@router.get("/appointments")
def get_pending_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointments = (
        db.query(Appointment)
        .filter(Appointment.status == "PENDING")
        .order_by(Appointment.created_at.desc())
        .all()
    )

    result = []

    for appointment in appointments:

        user = (
            db.query(User)
            .filter(User.id == appointment.user_id)
            .first()
        )

        result.append({
    "id": appointment.id,
    "user_name": appointment.user.full_name,
    "appointment_date": appointment.appointment_date,
    "reason": appointment.reason,
    "status": appointment.status,

    "dermatologist_name":
        appointment.dermatologist.full_name
        if appointment.dermatologist
        else "Not Selected",

    "dermatologist_id": appointment.dermatologist_id
})

    return result

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
            detail="Appointment not found",
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

    progress = (
        db.query(ProgressTracking)
        .filter(ProgressTracking.user_id == user.id)
        .all()
    )

    return {
        "appointment": appointment,
        "patient": user,
        "skin_profile": skin_profile,
        "lifestyle": lifestyle,
        "latest_assessment": assessment,
        "progress": progress,
    }

@router.put("/review/{appointment_id}")
def consultant_review(
    appointment_id: int,
    review: ConsultantReview,
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
            detail="Appointment not found",
        )

    appointment.status = review.status
    appointment.consultant_notes = review.consultant_notes
    appointment.dermatologist_recommended = review.dermatologist_recommended
    appointment.consultant_id = current_user.id

    # --------------------------
    # Notify Patient
    # --------------------------

    if review.status == "APPROVED":

        db.add(
            Notification(
                user_id=appointment.user_id,
                appointment_id=appointment.id,
                title="Appointment Approved",
                message="Your appointment has been approved by the consultant."
            )
        )

    elif review.status == "REJECTED":

        db.add(
            Notification(
                user_id=appointment.user_id,
                appointment_id=appointment.id,
                title="Appointment Rejected",
                message="Your appointment has been rejected by the consultant."
            )
        )

    # --------------------------
    # Notify Selected Dermatologist
    # --------------------------

    if review.dermatologist_recommended:

        print("Dermatologist ID =", appointment.dermatologist_id)

        if appointment.dermatologist_id is not None:

            db.add(
                Notification(
                    dermatologist_id=appointment.dermatologist_id,
                    appointment_id=appointment.id,
                    title="New Patient Assigned",
                    message=f"A new patient ({appointment.user.full_name}) has been assigned to you."
                )
            )

            print("Dermatologist notification added.")

    db.commit()

    print("Committed Successfully")

    return {
        "message": "Review submitted successfully."
    }

@router.get("/dashboard")
def consultant_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    pending = (
        db.query(Appointment)
        .filter(Appointment.status == "PENDING")
        .count()
    )

    approved = (
        db.query(Appointment)
        .filter(Appointment.status == "APPROVED")
        .count()
    )

    rejected = (
        db.query(Appointment)
        .filter(Appointment.status == "REJECTED")
        .count()
    )

    assigned = (
        db.query(Appointment)
        .filter(Appointment.dermatologist_recommended == True)
        .count()
    )

    # ----------------------------
    # Recent Consultant Activity
    # ----------------------------

    recent = (
    db.query(Appointment)
    .order_by(Appointment.created_at.desc())
    .limit(5)
    .all()
)

    recent_activity = []

    for appointment in recent:

        user = (
            db.query(User)
            .filter(User.id == appointment.user_id)
            .first()
        )

        patient = user.full_name if user else "Patient"

        if appointment.status == "APPROVED":

            recent_activity.append({
                "type": "approved",
                "title": "Appointment Approved",
                "message": f"Approved appointment for {patient}",
                "time": appointment.created_at.strftime("%d %b %Y %I:%M %p")
            })

        elif appointment.status == "REJECTED":

            recent_activity.append({
                "type": "rejected",
                "title": "Appointment Rejected",
                "message": f"Rejected appointment for {patient}",
                "time": appointment.created_at.strftime("%d %b %Y %I:%M %p")
            })

        elif appointment.dermatologist_recommended:

            recent_activity.append({
                "type": "referred",
                "title": "Patient Referred",
                "message": f"Referred {patient} to Dermatologist",
                "time": appointment.created_at.strftime("%d %b %Y %I:%M %p")
            })

        else:

            recent_activity.append({
                "type": "pending",
                "title": "New Appointment",
                "message": f"New appointment from {patient}",
                "time": appointment.created_at.strftime("%d %b %Y %I:%M %p")
            })

        

    return {
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "assigned": assigned,
        "recent_activity": recent_activity,
    }

from datetime import date, timedelta
from sqlalchemy import func

@router.get("/weekly-trend")
def consultant_weekly_trend(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()

    result = []

    for i in range(6, -1, -1):

        day = today - timedelta(days=i)

        count = (
            db.query(Appointment)
            .filter(
                Appointment.consultant_id == current_user.id,
                func.date(Appointment.appointment_date) == day,
                Appointment.status == "approved"
            )
            .count()
        )

        result.append({
            "day": day.strftime("%a"),
            "patients": count
        })

    return result