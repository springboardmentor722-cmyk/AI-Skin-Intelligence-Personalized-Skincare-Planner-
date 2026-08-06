from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import DermatologistTreatment, User

router = APIRouter(
    prefix="/user",
    tags=["Treatment"],
)

@router.get("/treatment")
def get_my_treatment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    treatment = (
        db.query(DermatologistTreatment)
        .filter(
            DermatologistTreatment.user_id == current_user.id
        )
        .order_by(
            DermatologistTreatment.created_at.desc()
        )
        .first()
    )

    if not treatment:
        raise HTTPException(
            status_code=404,
            detail="No treatment plan available."
        )

    return treatment