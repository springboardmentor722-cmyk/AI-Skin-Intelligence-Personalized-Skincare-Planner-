"""Reports & Export System routes."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import report_controller
from core.database import get_db
from core.dependencies import get_current_user, require_role
from core.mongodb import get_mongo_db
from models.user import User
from utils.constants import ROLE_CONSULTANT, ROLE_DERMATOLOGIST

router = APIRouter(prefix="/api/v1/reports", tags=["Reports & Export"])


def _pdf_response(data: bytes, filename: str) -> Response:
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _excel_response(data: bytes, filename: str) -> Response:
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d")


@router.get("/skin-health.pdf")
def skin_health_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Comprehensive PDF: profile, latest assessment breakdown, routine, lifestyle logs, and recommendations."""
    data = report_controller.get_my_skin_health_report(db, mongo_db, current_user)
    return _pdf_response(data, f"skin-health-report-{_timestamp()}.pdf")


@router.get("/progress.pdf")
def progress_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Score timeline, adherence rates, and progress-photo timeline as PDF."""
    data = report_controller.get_my_progress_report(db, mongo_db, current_user)
    return _pdf_response(data, f"progress-report-{_timestamp()}.pdf")


@router.get("/history.xlsx")
def history_excel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Multi-sheet Excel export: assessment history, lifestyle logs, order history."""
    data = report_controller.get_my_history_excel(db, current_user)
    return _excel_response(data, f"history-export-{_timestamp()}.xlsx")


@router.get(
    "/clients/{client_id}/skin-health.pdf",
    dependencies=[Depends(require_role(ROLE_CONSULTANT))],
)
def client_skin_health_report(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """A consultant's PDF report for one of their own assigned clients."""
    data = report_controller.get_client_report(db, mongo_db, current_user, client_id)
    return _pdf_response(data, f"client-report-{_timestamp()}.pdf")


@router.get(
    "/patients/{patient_id}/skin-health.pdf",
    dependencies=[Depends(require_role(ROLE_DERMATOLOGIST))],
)
def patient_skin_health_report(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """A dermatologist's PDF report for one of their own patients."""
    data = report_controller.get_patient_report(db, mongo_db, current_user, patient_id)
    return _pdf_response(data, f"patient-report-{_timestamp()}.pdf")
