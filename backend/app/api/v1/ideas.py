import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_admin
from app.models.idea_fiszka import IdeaFiszka
from app.models.communication import Mentor
from app.schemas.idea_schema import (
    FiszkaCreate,
    FiszkaResponse,
    FiszkaPublicStatus,
    FiszkaModeration,
    FISZKA_STATUSES,
    IMPLEMENTATION_STAGES,
    CanvasSubmission,
    CanvasAuditResponse,
    GrantCall,
    GrantApplicationRequest,
    GrantApplicationResponse,
    CanvasAutofillRequest,
    CanvasAutofillResponse
)
from app.services.ai_assistant import evaluate_canvas, generate_grant_application, list_grant_calls, get_grant_call
from app.services.groq_client import autofill_social_canvas
from app.services.notification_service import notify, ADMIN_RECIPIENT
from app.services.pii_filter import anonymize_text

router = APIRouter()


@router.post("/ideas", response_model=FiszkaPublicStatus, tags=["Moduł III: Kreator Pomysłów"])
async def create_idea_fiszka(req: FiszkaCreate, db: AsyncSession = Depends(get_db)):
    """
    Zgłoszenie fiszki pomysłu (24/7). Koordynator ROPS dostaje powiadomienie w panelu,
    autor – e-mail z numerem zgłoszenia i linkiem do śledzenia statusu.
    """
    fiszka = IdeaFiszka(
        id=f"fiszka-{uuid.uuid4().hex[:8]}",
        title=req.title.strip(),
        summary=req.summary.strip(),
        target_audience=req.target_audience.strip(),
        implementation_stage=req.implementation_stage,
        author_name=req.author_name.strip(),
        author_email=req.author_email.strip(),
        author_type=req.author_type,
        powiat=req.powiat,
        status="submitted",
        rodo_consent_at=datetime.utcnow(),
    )
    db.add(fiszka)
    await notify(
        db, ADMIN_RECIPIENT,
        subject=f"Nowa fiszka pomysłu: {fiszka.title}",
        body=f"Powiat {fiszka.powiat}, etap: {IMPLEMENTATION_STAGES[fiszka.implementation_stage]}. Czeka na weryfikację w Panelu ROPS.",
        related_type="fiszka", related_id=fiszka.id,
    )
    await notify(
        db, fiszka.author_email,
        subject=f"Potwierdzenie zgłoszenia {fiszka.id}",
        body=(f"Dziękujemy za zgłoszenie pomysłu „{fiszka.title}”. Numer zgłoszenia: {fiszka.id}. "
              f"Status sprawdzisz w Hubie: /status/{fiszka.id}. Koordynator ROPS odpowie w ciągu 5 dni roboczych."),
        related_type="fiszka", related_id=fiszka.id,
    )
    await db.commit()
    await db.refresh(fiszka)
    return await _public_status(db, fiszka)


@router.get("/ideas", response_model=List[FiszkaResponse], tags=["Moduł III: Kreator Pomysłów"])
async def list_idea_fiszkas(db: AsyncSession = Depends(get_db), _: str = Depends(require_admin)):
    """Lista fiszek z danymi kontaktowymi autorów – tylko dla zalogowanego koordynatora ROPS."""
    result = await db.execute(select(IdeaFiszka).order_by(IdeaFiszka.created_at.desc()))
    return result.scalars().all()


@router.get("/ideas/{fiszka_id}/status", response_model=FiszkaPublicStatus, tags=["Moduł III: Kreator Pomysłów"])
async def get_idea_status(fiszka_id: str, db: AsyncSession = Depends(get_db)):
    """Publiczny tracker statusu fiszki (bez danych osobowych) – link otrzymuje autor."""
    fiszka = await db.get(IdeaFiszka, fiszka_id)
    if not fiszka:
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    return await _public_status(db, fiszka)


@router.patch("/ideas/{fiszka_id}", response_model=FiszkaResponse, tags=["Moduł VI: Panel Administratora"])
async def moderate_idea(
    fiszka_id: str,
    req: FiszkaModeration,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    """Zmiana statusu fiszki przez ROPS wraz z komentarzem, który trafia do autora (e-mail + tracker)."""
    fiszka = await db.get(IdeaFiszka, fiszka_id)
    if not fiszka:
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    mentor = None
    if req.assigned_mentor_id:
        mentor = await db.get(Mentor, req.assigned_mentor_id)
        if not mentor:
            raise HTTPException(status_code=422, detail="Nie znaleziono wskazanego mentora.")
        fiszka.assigned_mentor_id = mentor.id

    fiszka.status = req.status
    if req.admin_notes is not None:
        fiszka.admin_notes = req.admin_notes.strip() or None
    fiszka.updated_at = datetime.utcnow()

    body = f"Status Twojej fiszki „{fiszka.title}”: {FISZKA_STATUSES[req.status]}."
    if fiszka.admin_notes:
        body += f"\n\nKomentarz koordynatora ROPS:\n{fiszka.admin_notes}"
    if mentor:
        body += f"\n\nTwój mentor: {mentor.full_name} ({mentor.specialization}), kontakt: {mentor.contact_email}."
    body += f"\n\nSzczegóły: /status/{fiszka.id}"
    await notify(db, fiszka.author_email, subject=f"Aktualizacja zgłoszenia {fiszka.id}", body=body,
                 related_type="fiszka", related_id=fiszka.id)
    await db.commit()
    await db.refresh(fiszka)
    return fiszka


async def _public_status(db: AsyncSession, fiszka: IdeaFiszka) -> FiszkaPublicStatus:
    mentor_name = None
    if fiszka.assigned_mentor_id:
        mentor = await db.get(Mentor, fiszka.assigned_mentor_id)
        mentor_name = mentor.full_name if mentor else None
    return FiszkaPublicStatus(
        id=fiszka.id,
        title=fiszka.title,
        status=fiszka.status,
        status_label=FISZKA_STATUSES.get(fiszka.status, fiszka.status),
        implementation_stage=fiszka.implementation_stage,
        admin_notes=fiszka.admin_notes,
        mentor_name=mentor_name,
        created_at=fiszka.created_at,
        updated_at=fiszka.updated_at,
    )


@router.post("/canvas/evaluate", response_model=CanvasAuditResponse, tags=["Moduł III: Kreator Pomysłów"])
async def audit_social_canvas(req: CanvasSubmission):
    """
    Automatyczna checklista Canwy: kompletność 9 pól, mierzalność wskaźników,
    rozpoznawalność partnerów i prompt do wizualizacji koncepcji.
    """
    return evaluate_canvas(req)


@router.get("/grant-calls", response_model=List[GrantCall], tags=["Moduł III: Kreator Pomysłów"])
async def grant_calls():
    """Nabory grantowe (dane demonstracyjne) z datami otwarcia/zamknięcia i kryteriami."""
    return list_grant_calls()


@router.post("/grant-applications/generate", response_model=GrantApplicationResponse, tags=["Moduł III: Kreator Pomysłów"])
async def create_grant_application(req: GrantApplicationRequest):
    """
    Generator szkicu wniosku – dostępny tylko dla otwartego naboru, dopasowany do jego kryteriów i limitów budżetu.
    """
    call = get_grant_call(req.call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Nie znaleziono naboru.")
    if not call.is_open:
        raise HTTPException(status_code=409, detail=f"Nabór „{call.title}” jest zamknięty ({call.opens_on} – {call.closes_on}).")
    if not (call.min_budget_pln <= req.requested_budget_pln <= call.max_budget_pln):
        raise HTTPException(
            status_code=422,
            detail=f"Kwota musi mieścić się w limicie naboru: {call.min_budget_pln}–{call.max_budget_pln} zł."
        )
    return generate_grant_application(req, call)


@router.post("/canvas/autofill", response_model=CanvasAutofillResponse, tags=["Moduł III: Kreator Pomysłów"])
async def autofill_canvas(req: CanvasAutofillRequest):
    """
    Wypełnienie 9 bloków Canwy na podstawie jednego zdania (Groq LLM, z lokalnym szablonem rezerwowym).
    """
    clean_prompt = anonymize_text(req.prompt)
    result = await autofill_social_canvas(
        prompt=clean_prompt,
        powiat=req.powiat or "Kraków",
        target_group=req.target_group
    )
    return CanvasAutofillResponse(**result)
