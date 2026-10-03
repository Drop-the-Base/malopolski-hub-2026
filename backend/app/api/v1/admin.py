from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_admin
from app.models.notification import Notification
from app.schemas.admin_trends_schema import TrendRadarSummary, SubmissionStatusUpdate, NotificationItem
from app.schemas.idea_schema import FiszkaModeration, FiszkaResponse
from app.services.trend_analyzer import analyze_social_trends, get_pending_submissions
from app.api.v1.ideas import moderate_idea

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/admin/trends", response_model=TrendRadarSummary, tags=["Moduł VI: Panel Administratora"])
async def get_trend_radar(db: AsyncSession = Depends(get_db)):
    """
    Radar trendów: agregacja zgłoszeń z Matchmakingu i Rejestru Wyzwań per powiat,
    wzrosty kwartalne, białe plamy i rekomendacje. Wymaga zalogowania koordynatora ROPS.
    """
    return await analyze_social_trends(db)

@router.get("/admin/submissions", response_model=List[FiszkaResponse], tags=["Moduł VI: Panel Administratora"])
async def list_admin_submissions(db: AsyncSession = Depends(get_db)):
    """Kolejka moderacji fiszek pomysłów (najnowsze na górze)."""
    return await get_pending_submissions(db)

@router.patch("/admin/submissions/{fiszka_id}/status", response_model=FiszkaResponse, tags=["Moduł VI: Panel Administratora"])
async def change_submission_status(fiszka_id: str, payload: SubmissionStatusUpdate, db: AsyncSession = Depends(get_db)):
    """Zgodność wsteczna – deleguje do PATCH /ideas/{id}."""
    moderation = FiszkaModeration(
        status=payload.new_status, admin_notes=payload.admin_feedback, assigned_mentor_id=payload.assigned_mentor_id
    )
    return await moderate_idea(fiszka_id, moderation, db, "rops_admin")

@router.get("/admin/notifications", response_model=List[NotificationItem], tags=["Moduł VI: Panel Administratora"])
async def list_notifications(
    channel: Optional[str] = Query(None, description="'panel' – powiadomienia dla ROPS, 'email' – skrzynka nadawcza"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Powiadomienia dla koordynatora oraz skrzynka nadawcza e-maili do autorów i mentorów."""
    q = select(Notification).order_by(Notification.created_at.desc()).limit(limit)
    if channel:
        q = q.where(Notification.channel == channel)
    return (await db.execute(q)).scalars().all()

@router.post("/admin/notifications/mark-read", tags=["Moduł VI: Panel Administratora"])
async def mark_notifications_read(db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).where(Notification.channel == "panel").values(is_read=True))
    await db.commit()
    return {"status": "ok"}
