"""AI skin analysis API — Milestone 3, Parts 4, 5, 8, 9.

Endpoints (all JWT-protected via the existing Milestone 1 `require(...)`):
    POST /api/v1/ai/skin-type      — classify skin type from a face image
    POST /api/v1/ai/skin-concern   — multi-label concern detection
    POST /api/v1/ai/full-analysis  — both, in one pass over the image
    GET  /api/v1/ai/history        — the user's past analyses
    GET  /api/v1/ai/status         — which inference backend is active

This is the API layer only: it validates the upload, calls the preprocessing ->
inference -> postprocessing layers, persists the result, and returns it. No CV or
model code lives here (spec Part 6 separation of concerns).
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import date, datetime

from fastapi import (APIRouter, Depends, File, HTTPException, Request, UploadFile,
                     status)
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..ai import inference, postprocessing, preprocessing
from ..config import get_settings
from ..database import get_db
from ..deps import audit, require
from ..models import SkinAnalysis, User
from ..schemas import SkinAnalysisOut

router = APIRouter(prefix="/v1/ai", tags=["ai-skin-analysis"])

_ALLOWED_CONTENT = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"}


async def _read_validated_upload(file: UploadFile) -> bytes:
    """Enforce content-type and size limits before any processing."""
    settings = get_settings()
    if file.content_type not in _ALLOWED_CONTENT:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            "Unsupported file type. Upload a JPG, PNG or WEBP image.")
    raw = await file.read()
    max_bytes = settings.ai_max_upload_mb * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            f"Image exceeds the {settings.ai_max_upload_mb} MB limit.")
    if not raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The uploaded file is empty.")
    return raw


def _save_image(raw: bytes, user_id: int, suffix: str) -> str:
    """Persist the upload to the uploads dir; return a relative path for the DB."""
    settings = get_settings()
    folder = os.path.join(settings.upload_dir, "skin")
    os.makedirs(folder, exist_ok=True)
    fname = f"{user_id}_{uuid.uuid4().hex}{suffix}"
    full = os.path.join(folder, fname)
    with open(full, "wb") as fh:
        fh.write(raw)
    return os.path.join("uploads", "skin", fname)


def _run_pipeline(raw: bytes) -> dict:
    """preprocess -> extract features -> infer -> postprocess. Shared by all routes."""
    settings = get_settings()
    try:
        pre = preprocessing.preprocess(raw, face_required=settings.ai_face_required)
    except preprocessing.ImageValidationError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))

    features = preprocessing.extract_features(pre["tensor"])

    st_probs, st_backend = inference.predict_skin_type(pre["tensor"], features)
    co_probs, co_backend = inference.predict_skin_concerns(pre["tensor"], features)

    skin_type_result = postprocessing.finalize_skin_type(st_probs)
    concern_result = postprocessing.finalize_concerns(co_probs)
    backend = "onnx" if "onnx" in (st_backend, co_backend) else "heuristic"
    explanation = postprocessing.build_explanation(
        skin_type_result, concern_result, features, backend)

    return {
        "pre": pre, "features": features,
        "skin_type_result": skin_type_result,
        "concern_result": concern_result,
        "backend": backend, "explanation": explanation,
    }


def _persist(db: Session, user: User, result: dict, analysis_type: str,
             image_path: str) -> SkinAnalysis:
    st = result["skin_type_result"]
    co = result["concern_result"]
    row = SkinAnalysis(
        user_id=user.id,
        analysis_type=analysis_type,
        detected_skin_type=st["skin_type"] if analysis_type != "skin-concern" else None,
        skin_type_confidence=st["confidence"] if analysis_type != "skin-concern" else None,
        skin_type_distribution=json.dumps(st["distribution"]) if analysis_type != "skin-concern" else None,
        detected_concerns=json.dumps(co["detected_concerns"]) if analysis_type != "skin-type" else "[]",
        priority_concern=co["priority_concern"] if analysis_type != "skin-type" else None,
        concern_scores=json.dumps(co["all_scores"]) if analysis_type != "skin-type" else None,
        features=json.dumps(result["features"]),
        explanation=result["explanation"],
        backend=result["backend"],
        face_found=result["pre"]["face_found"],
        image_path=image_path,
    )
    db.add(row)
    db.flush()
    return row


def _to_out(row: SkinAnalysis) -> SkinAnalysisOut:
    return SkinAnalysisOut(
        id=row.id, user_id=row.user_id, analysis_type=row.analysis_type,
        detected_skin_type=row.detected_skin_type,
        skin_type_confidence=row.skin_type_confidence,
        skin_type_distribution=json.loads(row.skin_type_distribution or "[]"),
        detected_concerns=json.loads(row.detected_concerns or "[]"),
        priority_concern=row.priority_concern,
        concern_scores=json.loads(row.concern_scores or "[]"),
        features=json.loads(row.features or "{}"),
        explanation=row.explanation, backend=row.backend,
        face_found=row.face_found, created_at=row.created_at,
    )


@router.get("/status")
def ai_status(user: User = Depends(require("assessment.read_own"))):
    """Which inference backend is active for each task."""
    return inference.model_status()


@router.post("/skin-type", response_model=SkinAnalysisOut, status_code=201)
async def analyze_skin_type(request: Request, file: UploadFile = File(...),
                            user: User = Depends(require("assessment.create")),
                            db: Session = Depends(get_db)):
    raw = await _read_validated_upload(file)
    result = _run_pipeline(raw)
    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    image_path = _save_image(raw, user.id, suffix)
    row = _persist(db, user, result, "skin-type", image_path)
    audit(db, request, user, "ai.skin_type", "skin_analysis", row.id,
          new_value={"skin_type": row.detected_skin_type, "backend": row.backend})
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.post("/skin-concern", response_model=SkinAnalysisOut, status_code=201)
async def analyze_skin_concern(request: Request, file: UploadFile = File(...),
                               user: User = Depends(require("assessment.create")),
                               db: Session = Depends(get_db)):
    raw = await _read_validated_upload(file)
    result = _run_pipeline(raw)
    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    image_path = _save_image(raw, user.id, suffix)
    row = _persist(db, user, result, "skin-concern", image_path)
    audit(db, request, user, "ai.skin_concern", "skin_analysis", row.id,
          new_value={"priority": row.priority_concern, "backend": row.backend})
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.post("/full-analysis", response_model=SkinAnalysisOut, status_code=201)
async def analyze_full(request: Request, file: UploadFile = File(...),
                       user: User = Depends(require("assessment.create")),
                       db: Session = Depends(get_db)):
    """Skin type + concerns in a single pass over the image (Part 9 default)."""
    raw = await _read_validated_upload(file)
    result = _run_pipeline(raw)
    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    image_path = _save_image(raw, user.id, suffix)
    row = _persist(db, user, result, "full", image_path)
    audit(db, request, user, "ai.full_analysis", "skin_analysis", row.id,
          new_value={"skin_type": row.detected_skin_type,
                     "priority": row.priority_concern, "backend": row.backend})
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.get("/history", response_model=list[SkinAnalysisOut])
def analysis_history(limit: int = 20,
                     user: User = Depends(require("assessment.read_own")),
                     db: Session = Depends(get_db)):
    rows = db.scalars(select(SkinAnalysis)
                      .where(SkinAnalysis.user_id == user.id)
                      .order_by(desc(SkinAnalysis.created_at))
                      .limit(min(limit, 100))).all()
    return [_to_out(r) for r in rows]


@router.get("/latest", response_model=SkinAnalysisOut)
def latest_analysis(user: User = Depends(require("assessment.read_own")),
                    db: Session = Depends(get_db)):
    row = db.scalar(select(SkinAnalysis).where(SkinAnalysis.user_id == user.id)
                    .order_by(desc(SkinAnalysis.created_at)).limit(1))
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No analysis yet.")
    return _to_out(row)
