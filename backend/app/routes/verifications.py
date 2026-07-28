import gridfs
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import io
import uuid
from datetime import datetime

from app.db.postgres import get_db
from app.db.mongo import mongo_db
from app.core.deps import get_current_user
from app.core.rbac import require_admin
from app.models.user import User, UserRole, UserStatus
from app.models.consultant_profile import ConsultantProfile
from app.models.dermatologist_profile import DermatologistProfile
from pydantic import BaseModel

router = APIRouter(prefix="/admin/verifications", tags=["admin-verifications"])
pro_router = APIRouter(prefix="/professionals", tags=["professionals"])

fs = gridfs.GridFS(mongo_db, collection="professional_documents")

class RejectRequest(BaseModel):
    reason: str
    admin_notes: Optional[str] = None

# -------------------------------------------------------------
# PROFESSIONAL ENDPOINTS
# -------------------------------------------------------------

@pro_router.post("/upload-documents")
async def upload_documents(
    files: List[UploadFile] = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows a consultant or dermatologist to upload verification documents.
    """
    if current_user.role not in [UserRole.CONSULTANT, UserRole.DERMATOLOGIST]:
        raise HTTPException(status_code=403, detail="Only professionals can upload verification documents.")
    
    uploaded_files = []
    
    for file in files:
        contents = await file.read()
        file_id = fs.put(
            contents, 
            filename=file.filename, 
            content_type=file.content_type,
            user_id=str(current_user.id),
            document_type=document_type,
            uploaded_at=datetime.utcnow()
        )
        uploaded_files.append(str(file_id))
    
    # Update the user status back to UNDER REVIEW if it was rejected
    if current_user.status == UserStatus.REJECTED.value:
        current_user.status = "under_review"
        db.commit()
        
    return {"message": "Documents uploaded successfully", "file_ids": uploaded_files}


@pro_router.get("/my-documents")
def get_my_documents(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.CONSULTANT, UserRole.DERMATOLOGIST]:
        raise HTTPException(status_code=403, detail="Only professionals can view verification documents.")
    
    docs = fs.find({"user_id": str(current_user.id)})
    result = []
    for doc in docs:
        result.append({
            "id": str(doc._id),
            "filename": doc.filename,
            "document_type": doc.document_type,
            "content_type": doc.content_type,
            "uploaded_at": doc.uploadDate
        })
    return {"documents": result}


# -------------------------------------------------------------
# ADMIN ENDPOINTS
# -------------------------------------------------------------

@router.get("")
def get_all_verifications(
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_admin: User = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role.in_([UserRole.CONSULTANT, UserRole.DERMATOLOGIST]))
    
    if role and role != "All":
        query = query.filter(User.role == role.lower())
    
    if status and status != "All":
        status_map = {
            "Pending": UserStatus.PENDING.value,
            "Under Review": "under_review",
            "Approved": UserStatus.APPROVED.value,
            "Rejected": UserStatus.REJECTED.value
        }
        mapped_status = status_map.get(status)
        if mapped_status:
            query = query.filter(User.status == mapped_status)
    
    users = query.all()
    
    results = []
    for user in users:
        hospital = "-"
        experience = "-"
        license_num = "-"
        
        if user.role == UserRole.DERMATOLOGIST and user.dermatologist_profile:
            hospital = user.dermatologist_profile.hospital_or_clinic_name or "-"
            experience = f"{user.dermatologist_profile.years_of_experience} Years" if user.dermatologist_profile.years_of_experience else "-"
            license_num = user.dermatologist_profile.medical_license_number or "-"
        elif user.role == UserRole.CONSULTANT and user.consultant_profile:
            experience = f"{user.consultant_profile.years_of_experience} Years" if user.consultant_profile.years_of_experience else "-"
            
        # Count documents in MongoDB
        doc_count = fs.find({"user_id": str(user.id)}).count() if hasattr(fs.find({"user_id": str(user.id)}), "count") else len(list(fs.find({"user_id": str(user.id)})))
        
        results.append({
            "id": str(user.id),
            "full_name": user.full_name,
            "role": user.role.value.capitalize() if hasattr(user.role, 'value') else str(user.role).capitalize(),
            "hospital": hospital,
            "medical_license": license_num,
            "experience": experience,
            "documents_uploaded": f"{doc_count} Documents",
            "submitted_date": user.created_at.strftime("%Y-%m-%d") if user.created_at else "-",
            "status": user.status.replace("_", " ").title(),
            "email": user.email
        })
        
    return results


@router.get("/{user_id}")
def get_verification_details(user_id: str, current_admin: User = Depends(require_admin()), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get Profile data
    profile_data = {}
    if user.role == UserRole.DERMATOLOGIST and user.dermatologist_profile:
        p = user.dermatologist_profile
        profile_data = {
            "hospital": p.hospital_or_clinic_name,
            "department": "Dermatology",
            "specialization": p.specialization,
            "medical_license": p.medical_license_number,
            "registration_number": getattr(p, "medical_council_registration", "-"),
            "years_experience": p.years_of_experience,
            "admin_notes": getattr(p, "admin_notes", "")
        }
    elif user.role == UserRole.CONSULTANT and user.consultant_profile:
        p = user.consultant_profile
        profile_data = {
            "specialization": p.specialization,
            "years_experience": p.years_of_experience,
            "certification": p.certification,
            "admin_notes": getattr(p, "admin_notes", "")
        }
        
    # Get Documents
    docs = fs.find({"user_id": str(user.id)})
    documents = []
    for doc in docs:
        documents.append({
            "id": str(doc._id),
            "filename": doc.filename,
            "document_type": doc.document_type,
            "content_type": doc.content_type,
            "uploaded_at": doc.uploadDate
        })
        
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role.value.capitalize(),
        "status": user.status.replace("_", " ").title(),
        "created_at": user.created_at,
        "profile": profile_data,
        "documents": documents
    }


@router.put("/{user_id}/approve")
def approve_professional(user_id: str, current_admin: User = Depends(require_admin()), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.status = UserStatus.APPROVED.value
    user.is_verified = True
    
    if user.role == UserRole.DERMATOLOGIST and user.dermatologist_profile:
        user.dermatologist_profile.reviewed_by = current_admin.id
        user.dermatologist_profile.reviewed_at = datetime.utcnow()
        user.dermatologist_profile.admin_notes = "Approved"
    elif user.role == UserRole.CONSULTANT and user.consultant_profile:
        if hasattr(user.consultant_profile, 'reviewed_by'):
            user.consultant_profile.reviewed_by = current_admin.id
            user.consultant_profile.reviewed_at = datetime.utcnow()
            user.consultant_profile.admin_notes = "Approved"
            
    db.commit()
    # Note: In a real app, send email/notification here
    return {"message": "Professional verified and approved successfully."}


@router.put("/{user_id}/reject")
def reject_professional(user_id: str, payload: RejectRequest, current_admin: User = Depends(require_admin()), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.status = UserStatus.REJECTED.value
    user.is_verified = False
    
    notes = f"Reason: {payload.reason}\nNotes: {payload.admin_notes}"
    
    if user.role == UserRole.DERMATOLOGIST and user.dermatologist_profile:
        user.dermatologist_profile.reviewed_by = current_admin.id
        user.dermatologist_profile.reviewed_at = datetime.utcnow()
        user.dermatologist_profile.admin_notes = notes
    elif user.role == UserRole.CONSULTANT and user.consultant_profile:
        if hasattr(user.consultant_profile, 'reviewed_by'):
            user.consultant_profile.reviewed_by = current_admin.id
            user.consultant_profile.reviewed_at = datetime.utcnow()
            user.consultant_profile.admin_notes = notes
            
    db.commit()
    # Note: Send rejection email/notification here
    return {"message": "Professional verification rejected."}


@router.get("/statistics/kpis")
def get_verification_kpis(current_admin: User = Depends(require_admin()), db: Session = Depends(get_db)):
    all_pros = db.query(User).filter(User.role.in_([UserRole.CONSULTANT, UserRole.DERMATOLOGIST])).all()
    
    pending = 0
    approved = 0
    rejected = 0
    today_requests = 0
    
    now = datetime.utcnow()
    
    for p in all_pros:
        if p.status in [UserStatus.PENDING.value, "under_review"]:
            pending += 1
        elif p.status == UserStatus.APPROVED.value:
            approved += 1
        elif p.status == UserStatus.REJECTED.value:
            rejected += 1
            
        if p.created_at and p.created_at.date() == now.date():
            today_requests += 1
            
    return {
        "pending_verification": pending,
        "approved_professionals": approved,
        "rejected_applications": rejected,
        "todays_requests": today_requests,
        "average_review_time": "24 Hours",
        "expiring_licenses": 3
    }


# -------------------------------------------------------------
# GLOBAL DOCUMENT ENDPOINT
# -------------------------------------------------------------
from bson.objectid import ObjectId

router_docs = APIRouter(prefix="/documents", tags=["documents"])

@router_docs.get("/{file_id}")
def get_document(file_id: str, current_user: User = Depends(get_current_user)):
    """
    Downloads or previews a document from MongoDB GridFS.
    Admin can view all. Pro can view their own.
    """
    try:
        grid_out = fs.get(ObjectId(file_id))
        
        if current_user.role != UserRole.ADMIN and grid_out.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
            
        return StreamingResponse(io.BytesIO(grid_out.read()), media_type=grid_out.content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")
