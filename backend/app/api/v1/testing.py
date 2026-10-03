from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.testing_schema import CampaignSummary, TesterRegistration, FeedbackSubmission, EvaluationReport
from app.services.testing_service import get_active_campaigns, register_tester, submit_feedback, get_campaign_report

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
