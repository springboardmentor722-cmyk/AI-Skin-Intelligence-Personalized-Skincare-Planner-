"""Reports & Export controller."""

import uuid

from fastapi import HTTPException, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from models.user import User
from services import booking_service, report_service


def get_my_skin_health_report(db: Session, mongo_db: Database, user: User) -> bytes:
    return report_service.build_skin_health_report_pdf(db, mongo_db, user.id)


def get_my_progress_report(db: Session, mongo_db: Database, user: User) -> bytes:
    return report_service.build_progress_report_pdf(db, mongo_db, user.id)


def get_my_history_excel(db: Session, user: User) -> bytes:
    return report_service.build_history_excel(db, user.id)


def get_client_report(db: Session, mongo_db: Database, consultant: User, client_id: uuid.UUID) -> bytes:
    if not booking_service.is_client_assigned_to_consultant(db, consultant.id, client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This client isn't assigned to you.")
    return report_service.build_skin_health_report_pdf(db, mongo_db, client_id)


def get_patient_report(db: Session, mongo_db: Database, dermatologist: User, patient_id: uuid.UUID) -> bytes:
    if not booking_service.has_patient_booked_with_dermatologist(db, dermatologist.id, patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This patient hasn't booked with you.")
    return report_service.build_skin_health_report_pdf(db, mongo_db, patient_id)
