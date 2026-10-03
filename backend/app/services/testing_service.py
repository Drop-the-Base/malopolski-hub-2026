import uuid
from typing import List
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.testing import TestingCampaign, TestingFeedback, TesterSignup
from app.schemas.testing_schema import CampaignSummary, TesterRegistration, FeedbackSubmission, EvaluationReport
from app.services.notification_service import notify, ADMIN_RECIPIENT


def compute_sus(answers: List[int]) -> float:
    """Standardowa punktacja SUS (Brooke 1996): pytania nieparzyste (x-1), parzyste (5-x), suma × 2,5."""
    total = sum((a - 1) if i % 2 == 0 else (5 - a) for i, a in enumerate(answers))
    return round(total * 2.5, 1)


def sus_grade(score: float) -> str:
    if score >= 80.3:
        return "A – doskonała użyteczność"
    if score >= 68:
        return "B/C – powyżej średniej"
    if score >= 51:
        return "D – wymaga poprawek"
    return "F – poważne problemy z użytecznością"


def _summary(c: TestingCampaign) -> CampaignSummary:
    return CampaignSummary(
        id=c.id,
        innovation_id=c.innovation_id,
        campaign_name=c.campaign_name,
        goal_description=c.goal_description,
        tester_profile_needed=c.tester_profile_needed,
        slots_total=c.slots_total,
        slots_taken=min(c.slots_taken, c.slots_total),
        status=c.status,
        deadline=c.deadline
    )


async def get_active_campaigns(db: AsyncSession) -> List[CampaignSummary]:
    result = await db.execute(
        select(TestingCampaign).where(TestingCampaign.status.in_(["open", "full"])).order_by(TestingCampaign.deadline)
    )
    return [_summary(c) for c in result.scalars().all()]


async def register_tester(db: AsyncSession, req: TesterRegistration) -> dict:
    camp = await db.get(TestingCampaign, req.campaign_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Nie znaleziono kampanii testowej.")
    if camp.status != "open" or camp.slots_taken >= camp.slots_total:
        raise HTTPException(status_code=409, detail="Nabór do tej kampanii jest zamknięty – wszystkie miejsca są zajęte.")

    email = req.tester_email.strip().lower()
    duplicate = (await db.execute(
        select(func.count(TesterSignup.id)).where(TesterSignup.campaign_id == camp.id, TesterSignup.tester_email == email)
    )).scalar()
    if duplicate:
        raise HTTPException(status_code=409, detail="Ten adres e-mail jest już zapisany do tej kampanii.")

    db.add(TesterSignup(
        id=f"signup-{uuid.uuid4().hex[:8]}",
        campaign_id=camp.id,
        tester_name=req.tester_name.strip(),
        tester_email=email,
        tester_role=req.tester_role,
        motivation=req.motivation.strip(),
        guardian_consent=req.guardian_consent,
    ))
    camp.slots_taken += 1
    if camp.slots_taken >= camp.slots_total:
        camp.status = "full"
    await notify(db, email, subject=f"Zapis na testy: {camp.campaign_name}",
                 body=f"Dziękujemy za zgłoszenie. Koordynator kampanii skontaktuje się z Tobą przed {camp.deadline:%d.%m.%Y}.",
                 related_type="campaign", related_id=camp.id)
    if camp.status == "full":
        await notify(db, ADMIN_RECIPIENT, subject=f"Komplet testerów: {camp.campaign_name}",
                     body=f"Kampania osiągnęła limit {camp.slots_total} miejsc.", related_type="campaign", related_id=camp.id)
    await db.commit()
    return {
        "status": "success",
        "message": f"Dziękujemy, {req.tester_name.strip()}! Zapisaliśmy Cię na testy. Potwierdzenie wyślemy e-mailem.",
        "campaign_id": camp.id,
        "slots_taken": camp.slots_taken,
        "slots_total": camp.slots_total,
    }


async def submit_feedback(db: AsyncSession, req: FeedbackSubmission) -> dict:
    if not await db.get(TestingCampaign, req.campaign_id):
        raise HTTPException(status_code=404, detail="Nie znaleziono kampanii testowej.")
    score = compute_sus(req.sus_answers)
    feedback_id = f"feed-{uuid.uuid4().hex[:8]}"
    db.add(TestingFeedback(
        id=feedback_id,
        campaign_id=req.campaign_id,
        tester_name=req.tester_name,
        tester_role=req.tester_role,
        sus_score=score,
        sus_answers=req.sus_answers,
        usability_rating=req.usability_rating,
        identified_barriers=req.identified_barriers,
        improvement_proposals=req.improvement_proposals
    ))
    await db.commit()
    return {
        "status": "success",
        "message": "Dziękujemy za przekazanie informacji zwrotnej!",
        "feedback_id": feedback_id,
        "sus_score": score,
        "sus_grade": sus_grade(score),
    }


async def get_campaign_report(db: AsyncSession, campaign_id: str) -> EvaluationReport:
    if not await db.get(TestingCampaign, campaign_id):
        raise HTTPException(status_code=404, detail="Nie znaleziono kampanii testowej.")
    result = await db.execute(select(TestingFeedback).where(TestingFeedback.campaign_id == campaign_id))
    feedbacks = result.scalars().all()

    if not feedbacks:
        return EvaluationReport(
            campaign_id=campaign_id,
            total_feedbacks=0,
            common_barriers=[],
            readiness_for_scaling=False
        )

    avg_sus = sum(f.sus_score for f in feedbacks) / len(feedbacks)
    avg_rating = sum(f.usability_rating for f in feedbacks) / len(feedbacks)
    barriers = [f.identified_barriers for f in feedbacks if f.identified_barriers]

    return EvaluationReport(
        campaign_id=campaign_id,
        total_feedbacks=len(feedbacks),
        average_sus_score=round(avg_sus, 1),
        sus_grade=sus_grade(avg_sus),
        satisfaction_rate=round(avg_rating / 5.0 * 100.0, 1),
        common_barriers=barriers[:3],
        readiness_for_scaling=avg_sus >= 68.0 and len(feedbacks) >= 5
    )
