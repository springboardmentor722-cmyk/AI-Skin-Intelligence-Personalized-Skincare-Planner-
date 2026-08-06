from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RoleRequest, User
from app.schemas import (
    RoleRequestCreate,
    RoleRequestResponse
)
from app.dependencies import get_current_user
from app.role_dependencies import require_role

from fastapi import UploadFile, File, Form
import shutil
import os
import uuid

router = APIRouter(
    prefix="/role-request",
    tags=["Role Request"]
)

@router.post("/apply", response_model=RoleRequestResponse)
def apply_for_role(
    requested_role: str = Form(...),
    qualification: str = Form(...),
    license_number: str = Form(...),
    experience: str = Form(...),
    certificate: UploadFile = File(...),
    id_proof: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != "user":
        raise HTTPException(
            status_code=400,
            detail="Only users can apply for a new role."
        )

    existing = db.query(RoleRequest).filter(
        RoleRequest.user_id == current_user.id,
        RoleRequest.status == "Pending"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending request."
        )

    # -----------------------------
    # Save Certificate
    # -----------------------------
    cert_ext = os.path.splitext(certificate.filename)[1]
    cert_name = f"{uuid.uuid4()}{cert_ext}"
    cert_path = os.path.join(
        "uploads",
        "certificates",
        cert_name
    )

    with open(cert_path, "wb") as buffer:
        shutil.copyfileobj(certificate.file, buffer)

    # -----------------------------
    # Save ID Proof
    # -----------------------------
    id_ext = os.path.splitext(id_proof.filename)[1]
    id_name = f"{uuid.uuid4()}{id_ext}"
    id_path = os.path.join(
        "uploads",
        "idproofs",
        id_name
    )

    with open(id_path, "wb") as buffer:
        shutil.copyfileobj(id_proof.file, buffer)

    # -----------------------------
    # Save Request
    # -----------------------------
    new_request = RoleRequest(
        user_id=current_user.id,
        requested_role=requested_role,
        qualification=qualification,
        license_number=license_number,
        experience=experience,
        certificate=cert_path,
        id_proof=id_path,
        status="Pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request

@router.get("/me", response_model=list[RoleRequestResponse])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return db.query(RoleRequest).filter(
        RoleRequest.user_id == current_user.id
    ).all()

@router.get("/pending", response_model=list[RoleRequestResponse])
def pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    return db.query(RoleRequest).filter(
        RoleRequest.status == "Pending"
    ).all()

@router.put("/{request_id}/approve")
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    request = db.query(RoleRequest).filter(
        RoleRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found."
        )

    user = db.query(User).filter(
        User.id == request.user_id
    ).first()

    user.role = request.requested_role

    request.status = "Approved"

    db.commit()

    return {
        "message": "Role approved successfully."
    }

@router.put("/{request_id}/reject")
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    request = db.query(RoleRequest).filter(
        RoleRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found."
        )

    request.status = "Rejected"

    db.commit()

    return {
        "message": "Request rejected."
    }