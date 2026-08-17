"""Diagnostic assessment endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import get_current_user, get_or_create_profile
from ..schemas import DiagnosticSubmitRequest
from ..services import diagnostic_service
from ..services.adaptive import serialize_profile
from ..services.me_cache import invalidate as me_cache_invalidate
from ..services.ratelimit import rate_limit

router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])

_DIAG_AI_LIMIT = rate_limit("diagnostic-ai", 120, 300)


@router.get("/status")
def status(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return {"diagnostic_completed": profile.diagnostic_completed, "requires_diagnostic": not profile.diagnostic_completed}


@router.get("/start")
def start(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    if profile.diagnostic_completed:
        return {"completed": True, "questions": None}
    test = diagnostic_service.create_or_get_test(db, user, profile)
    return {"completed": False, "questions": diagnostic_service.strip_answers(test.questions_json or {})}


@router.post("/submit")
def submit(payload: DiagnosticSubmitRequest, _: None = Depends(_DIAG_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    if profile.diagnostic_completed:
        raise HTTPException(status_code=409, detail="Diagnostic already completed")
    test = diagnostic_service.create_or_get_test(db, user, profile)
    if test is None:
        raise HTTPException(status_code=404, detail="No diagnostic found")
    result = diagnostic_service.submit_diagnostic(db, user, profile, test, payload.answers)
    me_cache_invalidate(user.id)
    return {"result": result, "profile": serialize_profile(db, profile)}
