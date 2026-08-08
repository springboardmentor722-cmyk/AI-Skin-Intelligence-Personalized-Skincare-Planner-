from typing import List, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import asyncio

from app.api import deps
from app.models.user import User
from app.models.consultant import (
    ConsultantProfile,
    ClientAssignment,
    ConsultantRecommendation,
    ConsultantNote,
    ConsultantFollowup,
    RecommendationHistory
)
from pydantic import BaseModel
from datetime import datetime
from app.api.v1.websockets import manager

router = APIRouter()

def trigger_sync(user_id: str):
    try:
        asyncio.run(manager.broadcast_to_user(user_id, {"type": "SYNC_REQUIRED"}))
    except Exception as e:
        print(f"Error triggering sync: {e}")

# --- Pydantic Schemas ---
class DashboardStatsOut(BaseModel):
    total_assigned_clients: int
    active_clients: int
    completed_consultations: int
    pending_recommendations: int
    follow_up_requests: int
    routine_compliance_rate: float
    client_satisfaction: float

class RecommendationCreate(BaseModel):
    client_id: UUID
    product_name: str
    brand: str
    category: str
    reason: str
    usage_instructions: str
    time_of_day: str
    notes: str

class NoteCreate(BaseModel):
    client_id: UUID
    note_type: str
    content: str
    is_visible_to_client: bool = False

class FollowupCreate(BaseModel):
    client_id: UUID
    scheduled_date: datetime
    notes: str = ""

# --- Endpoints ---

@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get statistics for the consultant dashboard.
    """
    # Verify consultant role
    if not any(role.name == "Consultant" for role in current_user.roles):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    assigned_count = db.query(ClientAssignment).filter(ClientAssignment.consultant_id == current_user.id).count()
    active_count = db.query(ClientAssignment).filter(ClientAssignment.consultant_id == current_user.id, ClientAssignment.status == "ACTIVE").count()
    
    # Mock some data for demonstration
    return {
        "total_assigned_clients": assigned_count,
        "active_clients": active_count,
        "completed_consultations": 24,
        "pending_recommendations": 5,
        "follow_up_requests": 3,
        "routine_compliance_rate": 87.5,
        "client_satisfaction": 4.8
    }

@router.get("/clients")
def get_assigned_clients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get all clients assigned to the consultant.
    """
    if not any(role.name == "Consultant" for role in current_user.roles):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    assignments = db.query(ClientAssignment).filter(ClientAssignment.consultant_id == current_user.id).offset(skip).limit(limit).all()
    
    clients = []
    for a in assignments:
        client_user = db.query(User).filter(User.id == a.client_id).first()
        if client_user:
            clients.append({
                "assignment_id": a.id,
                "client_id": client_user.id,
                "full_name": client_user.full_name,
                "email": client_user.email,
                "status": a.status,
                "assigned_at": a.assigned_at
            })
            
    return clients

@router.post("/recommendations")
def create_recommendation(
    *,
    db: Session = Depends(deps.get_db),
    recommendation_in: RecommendationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new product recommendation for a client.
    """
    if not any(role.name == "Consultant" for role in current_user.roles):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    rec = ConsultantRecommendation(
        consultant_id=current_user.id,
        client_id=recommendation_in.client_id,
        product_name=recommendation_in.product_name,
        brand=recommendation_in.brand,
        category=recommendation_in.category,
        reason=recommendation_in.reason,
        usage_instructions=recommendation_in.usage_instructions,
        time_of_day=recommendation_in.time_of_day,
        notes=recommendation_in.notes
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    
    background_tasks.add_task(trigger_sync, str(recommendation_in.client_id))
    return rec

@router.post("/notes")
def create_note(
    *,
    db: Session = Depends(deps.get_db),
    note_in: NoteCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Add a progress or lifestyle note for a client.
    """
    if not any(role.name == "Consultant" for role in current_user.roles):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    note = ConsultantNote(
        consultant_id=current_user.id,
        client_id=note_in.client_id,
        note_type=note_in.note_type,
        content=note_in.content,
        is_visible_to_client=note_in.is_visible_to_client
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.post("/followups")
def schedule_followup(
    *,
    db: Session = Depends(deps.get_db),
    followup_in: FollowupCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Schedule a follow-up with a client.
    """
    if not any(role.name == "Consultant" for role in current_user.roles):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    fu = ConsultantFollowup(
        consultant_id=current_user.id,
        client_id=followup_in.client_id,
        scheduled_date=followup_in.scheduled_date,
        notes=followup_in.notes
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return fu
