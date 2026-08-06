from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Appointment, User, Notification
from app.schemas import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


# -----------------------------
# Create Appointment
# -----------------------------
@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    new_appointment = Appointment(
    user_id=current_user.id,
    dermatologist_id=appointment.dermatologist_id,
    appointment_date=appointment.appointment_date,
    reason=appointment.reason,
    status="PENDING",
)

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    consultant = (
    db.query(User)
    .filter(User.role == "consultant")
    .first()
)

    print("========== CONSULTANT DEBUG ==========")
    print("Current User:", current_user.full_name)
    print("Consultant Found:", consultant)


    doctor = (
    db.query(User)
    .filter(User.id == appointment.dermatologist_id)
    .first()
)

    if consultant:

     notification = Notification(
        consultant_id=consultant.id,
        appointment_id=new_appointment.id,
        title="New Appointment Request",
        message=(
        f"{current_user.full_name} requested an appointment "
        f"with Dr. {doctor.full_name}."
)
    )

     db.add(notification)
     db.commit()

     print("✅ Consultant notification created!")

    else:

     print("❌ No consultant found")

# ------------------------------------
# Notify Consultant about new appointment
# ------------------------------------

    



    

    return new_appointment


# -----------------------------
# Get My Appointments
# -----------------------------
@router.get("/", response_model=list[AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    return appointments


# -----------------------------
# Get Appointment By ID
# -----------------------------
@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    return appointment


# -----------------------------
# Cancel Appointment
# -----------------------------
@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id,
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    if appointment.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Only pending appointments can be cancelled.",
        )
    from app.models import Notification
    db.query(Notification).filter(
    Notification.appointment_id == appointment.id
).delete()

    db.delete(appointment)
    db.commit()

    return {
        "message": "Appointment cancelled successfully."
    }