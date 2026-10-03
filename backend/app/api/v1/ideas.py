import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.idea_fiszka import IdeaFiszka, CanvasModel
from app.schemas.idea_schema import (
    FiszkaCreate,
    FiszkaResponse,
    CanvasSubmission,
    CanvasAuditResponse,
    GrantApplicationRequest,
    GrantApplicationResponse,
    CanvasAutofillRequest,
    CanvasAutofillResponse
)
from app.services.ai_assistant import evaluate_canvas, generate_grant_application
from app.services.groq_client import autofill_social_canvas
from app.services.pii_filter import anonymize_text

router = APIRouter()

@router.post("/ideas", response_model=FiszkaResponse, tags=["Moduł III: Kreator Pomysłów"])
async def create_idea_fiszka(req: FiszkaCreate, db: AsyncSession = Depends(get_db)):
    """
    Zgłaszanie nowej fiszki pomysłu na innowację społeczną (funkcja dostępna 24/7).
    """
    fiszka_id = f"fiszka-{uuid.uuid4().hex[:8]}"
    fiszka = IdeaFiszka(
        id=fiszka_id,
        title=req.title,
        summary=req.summary,
        target_audience=req.target_audience,
        implementation_stage=req.implementation_stage,
        author_name=req.author_name,
        author_email=req.author_email,
        author_type=req.author_type,
        powiat=req.powiat,
        status="submitted"
    )
    db.add(fiszka)
    await db.commit()
    await db.refresh(fiszka)
    return fiszka

@router.get("/ideas", response_model=List[FiszkaResponse], tags=["Moduł III: Kreator Pomysłów"])
async def list_idea_fiszkas(db: AsyncSession = Depends(get_db)):
    """Pobranie zgłoszonych fiszek pomysłów."""
    result = await db.execute(select(IdeaFiszka).order_by(IdeaFiszka.created_at.desc()))
    return result.scalars().all()

@router.post("/canvas/evaluate", response_model=CanvasAuditResponse, tags=["Moduł III: Kreator Pomysłów"])
async def audit_social_canvas(req: CanvasSubmission):
    """
    Asystent Kreatora Innowacji (AI Co-Pilot):
    Audyt logiczny 9 pól Canwy Innowacji Społecznej, wykrywanie luk i prompt wizualizatora prototypu.
    """
    return evaluate_canvas(req)

@router.post("/grant-applications/generate", response_model=GrantApplicationResponse, tags=["Moduł III: Kreator Pomysłów"])
async def create_grant_application(req: GrantApplicationRequest):
    """
    Generator wniosków grantowych na bieżące konkursy ROPS Kraków (np. Inkubator Włączenia Społecznego).
    """
    return generate_grant_application(req)

@router.post("/canvas/autofill", response_model=CanvasAutofillResponse, tags=["Moduł III: Kreator Pomysłów"])
async def autofill_canvas(req: CanvasAutofillRequest):
    """
    Błyskawiczne generowanie 9 bloków Canwy Innowacji Społecznej ROPS (Groq AI Fast-Track).
    Przekształca 1 zdanie obywatela w kompletny, spójny model innowacji w ~1s.
    """
    clean_prompt = anonymize_text(req.prompt)
    result = await autofill_social_canvas(
        prompt=clean_prompt,
        powiat=req.powiat or "Kraków",
        target_group=req.target_group
    )
    return CanvasAutofillResponse(**result)
