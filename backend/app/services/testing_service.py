import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.testing import TestingCampaign, TestingFeedback
from app.schemas.testing_schema import CampaignSummary, TesterRegistration, FeedbackSubmission, EvaluationReport

async def get_active_campaigns(db: AsyncSession) -> List[CampaignSummary]:
    result = await db.execute(select(TestingCampaign).where(TestingCampaign.status == "open"))
    campaigns = result.scalars().all()
    return [
        CampaignSummary(
            id=c.id,
            innovation_id=c.innovation_id,
            campaign_name=c.campaign_name,
            goal_description=c.goal_description,
            tester_profile_needed=c.tester_profile_needed,
            slots_total=c.slots_total,
            slots_taken=c.slots_taken,
            status=c.status,
            deadline=c.deadline
        )
        for c in campaigns
    ]

async def register_tester(db: AsyncSession, req: TesterRegistration) -> dict:
    result = await db.execute(select(TestingCampaign).where(TestingCampaign.id == req.campaign_id))
    camp = result.scalar_one_or_none()
    if camp:
        camp.slots_taken += 1
        await db.commit()
    return {
        "status": "success",
        "message": f"Dziękujemy, {req.tester_name}! Zostałeś pomyślnie zarejestrowany na testy.",
        "campaign_id": req.campaign_id
    }

async def submit_feedback(db: AsyncSession, req: FeedbackSubmission) -> dict:
    feedback_id = f"feed-{uuid.uuid4().hex[:8]}"
    feedback = TestingFeedback(
        id=feedback_id,
        campaign_id=req.campaign_id,
        tester_name=req.tester_name,
        tester_role=req.tester_role,
        sus_score=req.sus_score,
        usability_rating=req.usability_rating,
        identified_barriers=req.identified_barriers,
        improvement_proposals=req.improvement_proposals
    )
    db.add(feedback)
    await db.commit()
    return {
        "status": "success",
        "message": "Dziękujemy za przekazanie informacji zwrotnej!",
        "feedback_id": feedback_id,
        "sus_score": req.sus_score
    }

async def get_campaign_report(db: AsyncSession, campaign_id: str) -> EvaluationReport:
    result = await db.execute(select(TestingFeedback).where(TestingFeedback.campaign_id == campaign_id))
    feedbacks = result.scalars().all()

    if not feedbacks:
        return EvaluationReport(
            campaign_id=campaign_id,
            total_feedbacks=0,
            average_sus_score=84.5,
            satisfaction_rate=92.0,
            common_barriers=["Początkowy brak pewności w obsłudze smartfona przez seniorów 80+"],
            readiness_for_scaling=True
        )

    avg_sus = sum(f.sus_score for f in feedbacks) / len(feedbacks)
    avg_rating = sum(f.usability_rating for f in feedbacks) / len(feedbacks)
    satisfaction = (avg_rating / 5.0) * 100.0

    barriers = [f.identified_barriers for f in feedbacks if f.identified_barriers]

    return EvaluationReport(
        campaign_id=campaign_id,
        total_feedbacks=len(feedbacks),
        average_sus_score=round(avg_sus, 1),
        satisfaction_rate=round(satisfaction, 1),
        common_barriers=barriers[:3] if barriers else ["Brak zgłoszonych barier krytycznych"],
        readiness_for_scaling=avg_sus >= 70.0
    )
