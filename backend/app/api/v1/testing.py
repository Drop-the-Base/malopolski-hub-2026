from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.testing_schema import (
    CampaignSummary, TesterRegistration, FeedbackSubmission, EvaluationReport,
    InnovationRatingSubmission, InnovationRatingSummary,
)
from app.services.testing_service import (
    get_active_campaigns, register_tester, submit_feedback, get_campaign_report,
    get_innovation_rating, get_all_rating_summaries, rate_innovation,
)

router = APIRouter()

@router.get("/testing/campaigns", response_model=List[CampaignSummary], tags=["Moduł IV: Tester Innowacji"])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    """Lista aktywnych naborów na testy prototypów innowacji społecznych."""
    return await get_active_campaigns(db)

@router.post("/testing/register", tags=["Moduł IV: Tester Innowacji"])
async def register_for_testing(req: TesterRegistration, db: AsyncSession = Depends(get_db)):
    """Zgłoszenie chęci udziału w testach prototypu."""
    return await register_tester(db, req)

@router.post("/testing/feedback", tags=["Moduł IV: Tester Innowacji"])
async def send_feedback(req: FeedbackSubmission, db: AsyncSession = Depends(get_db)):
    """Przekazanie informacji zwrotnej i oceny System Usability Scale (SUS)."""
    return await submit_feedback(db, req)

@router.get("/testing/campaigns/{campaign_id}/report", response_model=EvaluationReport, tags=["Moduł IV: Tester Innowacji"])
async def campaign_report(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """Zbiorczy raport ewaluacyjny metryk użyteczności dla ROPS Kraków."""
    return await get_campaign_report(db, campaign_id)

@router.get("/testing/ratings", response_model=List[InnovationRatingSummary], tags=["Moduł IV: Tester Innowacji"])
async def list_rating_summaries(db: AsyncSession = Depends(get_db)):
    """Średnia ocena i liczba ocen dla każdej ocenionej innowacji (lista w Bibliotece)."""
    return await get_all_rating_summaries(db)

@router.get("/testing/innovations/{inn_id}/rating", response_model=InnovationRatingSummary, tags=["Moduł IV: Tester Innowacji"])
async def innovation_rating(inn_id: str, db: AsyncSession = Depends(get_db)):
    """Średnia ocena innowacji wystawiona z karty innowacji."""
    return await get_innovation_rating(db, inn_id)

@router.post("/testing/innovations/{inn_id}/rating", status_code=201, tags=["Moduł IV: Tester Innowacji"])
async def rate_single_innovation(inn_id: str, req: InnovationRatingSubmission, db: AsyncSession = Depends(get_db)):
    """Ocena 1–5 i opcjonalna propozycja usprawnienia z karty innowacji (propozycja trafia do Panelu ROPS)."""
    return await rate_innovation(db, inn_id, req)
