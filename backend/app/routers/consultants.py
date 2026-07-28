import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, notify, require
from ..models import ConsultantProfile, ConsultationRequest, Role, Routine, SkinProfile, User
from ..schemas import (
    ConsultantOut, ConsultationRequestIn, ConsultationRequestOut,
    ConsultationRequestUpdateIn, RoutineIn, RoutineOut, SkinProfileOut,
)

router = APIRouter(tags=["consultants"])


def _consultant_out(p: ConsultantProfile) -> ConsultantOut:
    o = ConsultantOut.model_validate(p)
    o.full_name = p.user.full_name if p.user else ""
    return o


def _request_out(r: ConsultationRequest) -> ConsultationRequestOut:
    o = ConsultationRequestOut.model_validate(r)
    o.patient_name = r.patient.full_name if r.patient else ""
    o.consultant_name = r.consultant.full_name if r.consultant else "Any available consultant"
    return o


@router.get("/consultants", response_model=list[ConsultantOut])
def directory(_: User = Depends(require("consultants.read")), db: Session = Depends(get_db)):
    rows = db.scalars(select(ConsultantProfile).join(User).where(
        ConsultantProfile.is_approved.is_(True), User.is_active.is_(True))).all()
    return [_consultant_out(p) for p in rows]


@router.post("/consultation-requests", response_model=ConsultationRequestOut, status_code=201)
def create_request(body: ConsultationRequestIn, request: Request,
                   user: User = Depends(require("consultation_requests.create")),
                   db: Session = Depends(get_db)):
    # A preferred date, when given, must not be in the past.
    if body.preferred_date and body.preferred_date < date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Preferred date must be today or later")

    consultant_id = None
    if body.consultant_user_id:
        consultant = db.get(User, body.consultant_user_id)
        if not consultant or consultant.role != Role.CONSULTANT:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Consultant not found")
        consultant_id = consultant.id

    req = ConsultationRequest(
        patient_id=user.id, consultant_id=consultant_id,
        request_type=body.request_type, details=body.details,
        preferred_date=body.preferred_date, preferred_time=body.preferred_time,
    )
    db.add(req)
    db.flush()

    # Notify the chosen consultant, or every approved consultant for open requests
    targets = [consultant_id] if consultant_id else [
        p.user_id for p in db.scalars(select(ConsultantProfile).where(ConsultantProfile.is_approved.is_(True))).all()
    ]
    for target in targets:
        notify(db, target, "New consultation request",
               f"{user.full_name} requested {body.request_type.replace('_', ' ')}", "consultation")

    audit(db, request, user, "consultation_request.create", "consultation_request", req.id,
          new_value=body.model_dump())
    db.commit()
    db.refresh(req)
    return _request_out(req)


@router.get("/consultation-requests/me", response_model=list[ConsultationRequestOut])
def my_requests(user: User = Depends(require("consultation_requests.read_own")),
                db: Session = Depends(get_db)):
    rows = db.scalars(select(ConsultationRequest).where(ConsultationRequest.patient_id == user.id)
                      .order_by(ConsultationRequest.created_at.desc())).all()
    return [_request_out(r) for r in rows]


@router.get("/consultation-requests/incoming", response_model=list[ConsultationRequestOut])
def incoming(user: User = Depends(require("consultation_requests.read_incoming")),
             db: Session = Depends(get_db)):
    rows = db.scalars(select(ConsultationRequest).where(
        (ConsultationRequest.consultant_id == user.id) |
        ((ConsultationRequest.consultant_id.is_(None)) & (ConsultationRequest.status == "pending"))
    ).order_by(ConsultationRequest.created_at.desc())).all()
    return [_request_out(r) for r in rows]


@router.patch("/consultation-requests/{req_id}", response_model=ConsultationRequestOut)
def update_request(req_id: int, body: ConsultationRequestUpdateIn, request: Request,
                   user: User = Depends(require("profile.read_own")),
                   db: Session = Depends(get_db)):
    req = db.get(ConsultationRequest, req_id)
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")

    is_patient = req.patient_id == user.id and user.role == Role.USER
    is_consultant = user.role == Role.CONSULTANT and (req.consultant_id in (None, user.id))
    is_admin = user.role == Role.ADMIN
    if not (is_patient or is_consultant or is_admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot modify this request")

    action = body.action
    old = {"status": req.status, "consultant_id": req.consultant_id}

    if action == "cancel" and (is_patient or is_admin):
        if req.status in ("completed", "cancelled"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "This request can no longer be cancelled")
        req.status = "cancelled"
    elif action == "accept" and (is_consultant or is_admin):
        if req.status != "pending":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only pending requests can be accepted")
        req.status = "accepted"
        req.consultant_id = user.id if is_consultant else req.consultant_id
        notify(db, req.patient_id, "Consultation accepted",
               f"{user.full_name} accepted your {req.request_type.replace('_', ' ')} request", "consultation")
    elif action == "reject" and (is_consultant or is_admin):
        if req.status != "pending":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only pending requests can be declined")
        req.status = "rejected"
        notify(db, req.patient_id, "Consultation declined",
               "You can send the request to another consultant.", "consultation")
    elif action == "complete" and (is_consultant or is_admin):
        req.status = "completed"
        notify(db, req.patient_id, "Session completed", "Check your routines for updates.", "consultation")
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"'{action}' is not allowed for your role here")

    audit(db, request, user, f"consultation_request.{action}", "consultation_request", req.id,
          old_value=old, new_value={"status": req.status, "consultant_id": req.consultant_id})
    db.commit()
    db.refresh(req)
    return _request_out(req)


@router.get("/clients/{patient_id}/skin-profile", response_model=SkinProfileOut)
def client_skin_profile(patient_id: int,
                        user: User = Depends(require("clients.read_assigned")),
                        db: Session = Depends(get_db)):
    """Consultants may view the skin profile of patients who sent them a request."""
    if user.role != Role.ADMIN:
        linked = db.scalar(select(ConsultationRequest).where(
            ConsultationRequest.patient_id == patient_id,
            (ConsultationRequest.consultant_id == user.id) | (ConsultationRequest.consultant_id.is_(None)),
        ))
        if not linked:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This patient has not requested you")
    profile = db.scalar(select(SkinProfile).where(SkinProfile.user_id == patient_id))
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No skin profile yet")
    return profile


@router.post("/routines", response_model=RoutineOut, status_code=201)
def create_routine(body: RoutineIn, request: Request,
                   user: User = Depends(require("routines.create")),
                   db: Session = Depends(get_db)):
    patient = db.get(User, body.patient_id)
    if not patient or patient.role != Role.USER:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    routine = Routine(
        patient_id=body.patient_id, consultant_id=user.id, title=body.title,
        morning_steps=json.dumps(body.morning_steps),
        night_steps=json.dumps(body.night_steps),
        weekly_steps=json.dumps(body.weekly_steps),
        lifestyle_advice=body.lifestyle_advice,
    )
    db.add(routine)
    db.flush()
    notify(db, body.patient_id, "New routine ready",
           f"{user.full_name} built '{body.title}' for you", "routine")
    audit(db, request, user, "routine.create", "routine", routine.id, new_value={"patient_id": body.patient_id})
    db.commit()
    db.refresh(routine)
    return routine


@router.get("/routines/me", response_model=list[RoutineOut])
def my_routines(user: User = Depends(require("routines.read_own")),
                db: Session = Depends(get_db)):
    rows = db.scalars(select(Routine).where(Routine.patient_id == user.id)
                      .order_by(Routine.created_at.desc())).all()
    return rows
