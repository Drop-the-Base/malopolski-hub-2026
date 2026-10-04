"""
Panel eksperta / mentora (G15): demo-logowanie (wybór mentora + wspólny kod), kolejka fiszek, pytania z Dialogu,
konsultacje i szybka opinia do autora. Koordynator ROPS widzi aktywność mentorów.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_mentor_token, require_admin, require_mentor, verify_mentor_code
from app.models.communication import Mentor
from app.schemas.mentor_schema import (
    MentorActivitySummary,
    MentorDashboard,
    MentorFiszkaItem,
    MentorLoginRequest,
    MentorLoginResponse,
    MentorTextCreate,
    MentorThreadItem,
)
from app.services.mentor_service import (
    mentor_activity,
    mentor_dashboard,
    mentor_profile,
    reply_to_thread,
    send_fiszka_feedback,
)

router = APIRouter(tags=["Panel eksperta / mentora"])


@router.post("/auth/mentor-login", response_model=MentorLoginResponse)
async def mentor_login(req: MentorLoginRequest, db: AsyncSession = Depends(get_db)):
    """Demo-dostęp mentora: wybór osoby z bazy mentorów + kod dostępu (`MENTOR_PASSWORD`). Token nie otwiera Panelu ROPS."""
    mentor = await db.get(Mentor, req.mentor_id)
    if not mentor or not verify_mentor_code(req.access_code):
        raise HTTPException(status_code=401, detail="Nieprawidłowy mentor lub kod dostępu.")
    return MentorLoginResponse(
        access_token=create_mentor_token(mentor.id),
        expires_in_minutes=settings.ADMIN_TOKEN_TTL_MINUTES,
        mentor=mentor_profile(mentor),
    )


@router.get("/mentor/me", response_model=MentorDashboard)
async def my_dashboard(mentor_id: str = Depends(require_mentor), db: AsyncSession = Depends(get_db)):
    """Przydzielone fiszki (z rozmową w sprawie), otwarte pytania z Dialogu w moim obszarze i moje konsultacje."""
    return await mentor_dashboard(db, mentor_id)


@router.post("/mentor/fiszki/{fiszka_id}/feedback", response_model=MentorFiszkaItem, status_code=201)
async def fiszka_feedback(fiszka_id: str, req: MentorTextCreate, mentor_id: str = Depends(require_mentor),
                          db: AsyncSession = Depends(get_db)):
    """Opinia mentora: wiadomość w wątku sprawy (autor widzi ją na /status/{id}), e-mail do autora, powiadomienie dla ROPS."""
    return await send_fiszka_feedback(db, mentor_id, fiszka_id, req.body)


@router.post("/mentor/threads/{thread_id}/reply", response_model=MentorThreadItem, status_code=201)
async def thread_reply(thread_id: str, req: MentorTextCreate, mentor_id: str = Depends(require_mentor),
                       db: AsyncSession = Depends(get_db)):
    """Odpowiedź zweryfikowanego mentora w wątku Dialogu (podpis imieniem i nazwiskiem z bazy mentorów)."""
    return await reply_to_thread(db, mentor_id, thread_id, req.body)


@router.get("/admin/mentor-activity", response_model=MentorActivitySummary, dependencies=[Depends(require_admin)])
async def admin_mentor_activity(db: AsyncSession = Depends(get_db)):
    """Panel ROPS: ile opinii i odpowiedzi wysłali mentorzy, ile fiszek czeka na pierwszą opinię."""
    return await mentor_activity(db)
