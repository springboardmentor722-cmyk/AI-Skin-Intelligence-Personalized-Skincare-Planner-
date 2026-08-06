from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ProgressTracking, User
from app.schemas import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse
)
from app.dependencies import get_current_user
from app.models import SkinAssessment
from app.services.progress_service import calculate_progress

router = APIRouter(
    prefix="/progress",
    tags=["Progress Tracking"]
)

@router.get("/summary")
def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(2)
        .all()
    )

    if len(assessments) < 2:
        return {
            "message": "At least two assessments are required.",
            "progress": None
        }

    latest = assessments[0]
    previous = assessments[1]

    progress = calculate_progress(previous, latest)

    return {
        "latest_assessment": latest.created_at,
        "previous_assessment": previous.created_at,
        "progress": progress
    }

@router.get("/history")
def get_progress_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.asc())
        .all()
    )

    return [
        {
            "id": assessment.id,
            "date": assessment.created_at.strftime("%Y-%m-%d"),
            "overall_score": assessment.overall_score,
            "acne_score": assessment.acne_score,
            "pigmentation_score": assessment.pigmentation_score,
            "redness_score": assessment.redness_score,
            "wrinkles_score": assessment.wrinkles_score,
            "dark_circle_score": assessment.dark_circle_score,
        }
        for assessment in assessments
    ]

@router.post("/", response_model=ProgressResponse)
def create_progress(
    progress: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_progress = ProgressTracking(
    user_id=current_user.id,
    acne_level=progress.acne_level,
    hydration_level=progress.hydration_level,
    pigmentation=progress.pigmentation,
    redness=progress.redness,
    notes=progress.notes,
    image_url=progress.image_url
)

    db.add(new_progress)
    db.commit()
    db.refresh(new_progress)

    return new_progress

@router.get("/", response_model=list[ProgressResponse])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    progress = db.query(ProgressTracking).filter(
        ProgressTracking.user_id == current_user.id
    ).all()

    return progress

@router.put("/{progress_id}", response_model=ProgressResponse)
def update_progress(
    progress_id: int,
    updated: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    progress = db.query(ProgressTracking).filter(
        ProgressTracking.id == progress_id,
        ProgressTracking.user_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Progress record not found"
        )

    progress.acne_level = updated.acne_level
    progress.hydration_level = updated.hydration_level
    progress.pigmentation = updated.pigmentation
    progress.redness = updated.redness
    progress.notes = updated.notes
    progress.image_url = updated.image_url

    db.commit()
    db.refresh(progress)

    return progress

@router.delete("/{progress_id}")
def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    progress = db.query(ProgressTracking).filter(
        ProgressTracking.id == progress_id,
        ProgressTracking.user_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Progress record not found"
        )

    db.delete(progress)
    db.commit()

    return {
        "message": "Progress deleted successfully"
    }


from datetime import date, timedelta
from sqlalchemy import func

from app.models import RoutineLog

@router.get("/dashboard")
def get_progress_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    today = date.today()

    # Today's completed steps
    today_completed = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == current_user.id,
            RoutineLog.date == today,
            RoutineLog.completed == True,
        )
        .count()
    )

    TOTAL_STEPS = 5

    today_completion = round(
        (today_completed / TOTAL_STEPS) * 100,
        1,
    )

    # Morning completion
    morning_completed = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == current_user.id,
            RoutineLog.date == today,
            RoutineLog.routine_time == "Morning",
            RoutineLog.completed == True,
        )
        .count()
    )

    morning_completion = round(
        (morning_completed / 3) * 100,
        1,
    )

    # Night completion
    night_completed = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == current_user.id,
            RoutineLog.date == today,
            RoutineLog.routine_time == "Night",
            RoutineLog.completed == True,
        )
        .count()
    )

    night_completion = round(
        (night_completed / 2) * 100,
        1,
    )

    # Products used today
    products_used = today_completed

    # Last 7 days
    daily_progress = []

    for i in range(6, -1, -1):

        d = today - timedelta(days=i)

        completed = (
            db.query(RoutineLog)
            .filter(
                RoutineLog.user_id == current_user.id,
                RoutineLog.date == d,
                RoutineLog.completed == True,
            )
            .count()
        )

        percentage = round(
            (completed / TOTAL_STEPS) * 100,
            1,
        )

        daily_progress.append({
            "date": d.strftime("%a"),
            "completion": percentage,
        })

    # Weekly average
    weekly_completion = round(
        sum(x["completion"] for x in daily_progress) / 7,
        1,
    )

    # Current streak
    streak = 0

    for i in range(0, 365):

        d = today - timedelta(days=i)

        completed = (
            db.query(RoutineLog)
            .filter(
                RoutineLog.user_id == current_user.id,
                RoutineLog.date == d,
                RoutineLog.completed == True,
            )
            .count()
        )

        if completed > 0:
            streak += 1
        else:
            break

    return {
        "today_completion": today_completion,
        "current_streak": streak,
        "products_used": products_used,
        "weekly_completion": weekly_completion,
        "morning_completion": morning_completion,
        "night_completion": night_completion,
        "daily_progress": daily_progress,
    }

@router.get("/{progress_id}", response_model=ProgressResponse)
def get_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.query(ProgressTracking).filter(
        ProgressTracking.id == progress_id,
        ProgressTracking.user_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Progress record not found"
        )

    return progress