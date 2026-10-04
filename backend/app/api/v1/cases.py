"""
„Moje sprawy” (G4): oś czasu zgłoszenia, rozmowa autora z koordynatorem ROPS i liczniki w panelu.

Ścieżka komunikacji: nowa fiszka → powiadomienie w Panelu ROPS → przyjęcie (przeczytane) → ocena/mentor →
decyzja → odpowiedź koordynatora (e-mail + strona statusu) → pytanie uzupełniające autora → powiadomienie w panelu.
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_admin
from app.models.case_message import CaseMessage
from app.models.idea_fiszka import IdeaFiszka
from app.models.innovation import Innovation
from app.models.notification import Notification
from app.models.problem_report import ProblemReport
from app.schemas.case_schema import (
    AdminInboxSummary,
    AuthorMessageCreate,
    CaseAccessRequest,
    CaseMessageItem,
    FiszkaCaseView,
    ProblemPublicStatus,
    RopsMessageCreate,
)
from app.services.case_service import (
    PROBLEM_STATUS_LABELS,
    add_case_message,
    build_problem_timeline,
    emails_match,
    list_case_messages,
)
from app.services.notification_service import ADMIN_RECIPIENT, notify
from app.api.v1.ideas import _public_status

router = APIRouter(tags=["Moje sprawy: status i rozmowa z ROPS"])

MAX_AUTHOR_MESSAGES = 30
ACCESS_DENIED = "Ten adres e-mail nie pasuje do zgłoszenia. Wpisz adres podany przy wysyłaniu fiszki."


async def _verified_fiszka(db: AsyncSession, fiszka_id: str, email: str) -> IdeaFiszka:
    fiszka = await db.get(IdeaFiszka, fiszka_id)
    if not fiszka:
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    if not emails_match(fiszka.author_email, email):
        raise HTTPException(status_code=403, detail=ACCESS_DENIED)
    return fiszka


async def _case_view(db: AsyncSession, fiszka: IdeaFiszka) -> FiszkaCaseView:
    return FiszkaCaseView(
        status=await _public_status(db, fiszka, with_timeline=True),
        messages=[CaseMessageItem.model_validate(m) for m in await list_case_messages(db, fiszka.id)],
    )


@router.post("/ideas/{fiszka_id}/case", response_model=FiszkaCaseView)
async def open_my_case(fiszka_id: str, req: CaseAccessRequest, db: AsyncSession = Depends(get_db)):
    """Autor (numer fiszki + e-mail ze zgłoszenia) widzi oś czasu i rozmowę z koordynatorem ROPS."""
    fiszka = await _verified_fiszka(db, fiszka_id, req.email)
    return await _case_view(db, fiszka)


@router.post("/ideas/{fiszka_id}/messages", response_model=FiszkaCaseView, status_code=201)
async def ask_follow_up(fiszka_id: str, req: AuthorMessageCreate, db: AsyncSession = Depends(get_db)):
    """Pytanie uzupełniające autora – trafia do Panelu ROPS jako powiadomienie."""
    fiszka = await _verified_fiszka(db, fiszka_id, req.email)
    sent = (await db.execute(
        select(func.count(CaseMessage.id)).where(CaseMessage.case_id == fiszka.id, CaseMessage.sender == "author")
    )).scalar() or 0
    if sent >= MAX_AUTHOR_MESSAGES:
        raise HTTPException(status_code=429, detail="Osiągnięto limit wiadomości w tej sprawie. Skontaktuj się z ROPS telefonicznie.")
    add_case_message(db, fiszka.id, "author", req.body)
    preview = req.body if len(req.body) <= 300 else req.body[:297] + "…"
    await notify(
        db, ADMIN_RECIPIENT,
        subject=f"Pytanie od autora fiszki: {fiszka.title}",
        body=f"{fiszka.id}: {preview}",
        related_type="fiszka_message", related_id=fiszka.id,
    )
    await db.commit()
    return await _case_view(db, fiszka)


@router.get("/cases/problems/{problem_id}", response_model=ProblemPublicStatus)
async def get_problem_status(problem_id: str, db: AsyncSession = Depends(get_db)):
    """Publiczny status zgłoszenia z Rejestru wyzwań (tytuł bez danych osobowych, status, przypisane rozwiązanie)."""
    report = await db.get(ProblemReport, problem_id)
    if not report or report.status not in PROBLEM_STATUS_LABELS:
        raise HTTPException(status_code=404, detail="Nie znaleziono zgłoszenia o podanym numerze.")
    innovation_title = None
    if report.assigned_innovation_id:
        innovation = await db.get(Innovation, report.assigned_innovation_id)
        innovation_title = innovation.title if innovation else None
    return ProblemPublicStatus(
        id=report.id,
        title=report.title,
        powiat=report.powiat,
        gmina=report.gmina,
        status=report.status,
        status_label=PROBLEM_STATUS_LABELS[report.status],
        assigned_innovation_id=report.assigned_innovation_id,
        assigned_innovation_title=innovation_title,
        created_at=report.created_at,
        timeline=build_problem_timeline(report),
    )


# --- Panel ROPS -------------------------------------------------------------------------------------------

@router.get("/admin/inbox-summary", response_model=AdminInboxSummary, dependencies=[Depends(require_admin)])
async def inbox_summary(db: AsyncSession = Depends(get_db)):
    """Liczniki do plakietki w nawigacji: nowe fiszki (nieprzyjęte) i nieprzeczytane pytania autorów."""
    new_ids = (await db.execute(
        select(IdeaFiszka.id).where(IdeaFiszka.read_at.is_(None), IdeaFiszka.status == "submitted")
        .order_by(IdeaFiszka.created_at.desc())
    )).scalars().all()
    rows = (await db.execute(
        select(CaseMessage.case_id, func.count(CaseMessage.id))
        .where(CaseMessage.sender == "author", CaseMessage.read_by_rops.is_(False))
        .group_by(CaseMessage.case_id)
    )).all()
    unread_by_case = {case_id: count for case_id, count in rows}
    unread_notifications = (await db.execute(
        select(func.count(Notification.id)).where(Notification.channel == "panel", Notification.is_read.is_(False))
    )).scalar() or 0
    unread_messages = sum(unread_by_case.values())
    return AdminInboxSummary(
        new_submissions=len(new_ids),
        new_submission_ids=list(new_ids),
        unread_messages=unread_messages,
        unread_by_case=unread_by_case,
        unread_notifications=unread_notifications,
        total_attention=len(new_ids) + unread_messages,
    )


@router.post("/admin/submissions/{fiszka_id}/read", dependencies=[Depends(require_admin)])
async def acknowledge_submission(fiszka_id: str, db: AsyncSession = Depends(get_db)):
    """Koordynator potwierdza przyjęcie fiszki – autor dostaje e-mail, a na osi czasu pojawia się data."""
    fiszka = await db.get(IdeaFiszka, fiszka_id)
    if not fiszka:
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    if fiszka.read_at is None:
        fiszka.read_at = datetime.utcnow()
        await notify(
            db, fiszka.author_email,
            subject=f"ROPS przyjął Twoje zgłoszenie {fiszka.id}",
            body=(f"Koordynator ROPS przeczytał Twój pomysł „{fiszka.title}” i rozpoczyna ocenę. "
                  f"Postęp sprawdzisz tutaj: /status/{fiszka.id}"),
            related_type="fiszka", related_id=fiszka.id,
        )
        await db.commit()
    return {"status": "ok", "id": fiszka.id, "read_at": fiszka.read_at}


@router.get("/admin/submissions/{fiszka_id}/messages", response_model=List[CaseMessageItem],
            dependencies=[Depends(require_admin)])
async def admin_case_messages(fiszka_id: str, db: AsyncSession = Depends(get_db)):
    """Rozmowa z autorem fiszki. Odczyt oznacza pytania autora jako przeczytane."""
    if not await db.get(IdeaFiszka, fiszka_id):
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    messages = await list_case_messages(db, fiszka_id)
    result = [CaseMessageItem.model_validate(m) for m in messages]  # stan „nieprzeczytane” sprzed odczytu
    await db.execute(
        update(CaseMessage).where(CaseMessage.case_id == fiszka_id, CaseMessage.sender == "author")
        .values(read_by_rops=True)
    )
    await db.commit()
    return result


@router.post("/admin/submissions/{fiszka_id}/messages", response_model=List[CaseMessageItem], status_code=201,
             dependencies=[Depends(require_admin)])
async def admin_reply(fiszka_id: str, req: RopsMessageCreate, db: AsyncSession = Depends(get_db)):
    """Odpowiedź koordynatora – zapis w wątku i e-mail do autora z linkiem do strony statusu."""
    fiszka = await db.get(IdeaFiszka, fiszka_id)
    if not fiszka:
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    now = datetime.utcnow()
    add_case_message(db, fiszka.id, "rops", req.body)
    if fiszka.read_at is None:
        fiszka.read_at = now
    fiszka.updated_at = now
    await db.execute(
        update(CaseMessage).where(CaseMessage.case_id == fiszka.id, CaseMessage.sender == "author")
        .values(read_by_rops=True)
    )
    await notify(
        db, fiszka.author_email,
        subject=f"Odpowiedź koordynatora ROPS w sprawie {fiszka.id}",
        body=(f"Koordynator ROPS odpowiedział w sprawie Twojego pomysłu „{fiszka.title}”:\n\n{req.body}\n\n"
              f"Całą rozmowę zobaczysz i odpowiesz tutaj: /status/{fiszka.id}"),
        related_type="fiszka", related_id=fiszka.id,
    )
    await db.commit()
    return [CaseMessageItem.model_validate(m) for m in await list_case_messages(db, fiszka.id)]
