"""„Moje sprawy” (G4): oś czasu fiszki i zgłoszenia z rejestru, wątek autor ↔ ROPS."""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.case_message import CaseMessage
from app.models.idea_fiszka import IdeaFiszka
from app.models.problem_report import ProblemReport
from app.schemas.idea_schema import TimelineStep, FISZKA_STATUSES

REVIEW_STATUSES = {"in_review", "in_testing", "needs_changes", "approved", "rejected"}
DECISION_STATUSES = {"in_testing", "needs_changes", "approved", "rejected"}
DECISION_TONES = {"approved": "positive", "in_testing": "positive", "needs_changes": "warning", "rejected": "negative"}

PROBLEM_STATUS_LABELS = {
    "nowy": "Nowe zgłoszenie",
    "w_analizie": "W analizie",
    "przypisana_innowacja": "Przypisano rozwiązanie",
    "wdrazany": "Rozwiązanie jest wdrażane",
    "rozwiazany": "Rozwiązane",
}


def _mark_current(steps: List[TimelineStep]) -> List[TimelineStep]:
    """Bieżący krok = pierwszy nieukończony (albo ostatni, gdy wszystko zrobione)."""
    pending = next((s for s in steps if not s.done), None)
    (pending or steps[-1]).current = True
    return steps


def build_fiszka_timeline(
    fiszka: IdeaFiszka, mentor_name: Optional[str], last_rops_message_at: Optional[datetime]
) -> List[TimelineStep]:
    status = fiszka.status or "submitted"
    received = bool(fiszka.read_at) or status != "submitted"
    in_review = status in REVIEW_STATUSES or bool(fiszka.assigned_mentor_id)
    decided = status in DECISION_STATUSES
    has_reply = bool(fiszka.admin_notes) or last_rops_message_at is not None

    review_desc = "Koordynator ocenia pomysł i w razie potrzeby przydziela mentora."
    if mentor_name:
        review_desc = f"Przydzielony mentor: {mentor_name}."
    elif in_review:
        review_desc = "Koordynator ROPS ocenia pomysł."

    if decided:
        decision_desc = f"Decyzja: {FISZKA_STATUSES.get(status, status)}."
        if status == "needs_changes":
            decision_desc += " Uzupełnij zgłoszenie według wskazówek koordynatora."
    else:
        decision_desc = "Decyzję zobaczysz tutaj i dostaniesz ją e-mailem."

    reply_dates = [d for d in (fiszka.admin_notes_at, last_rops_message_at) if d]
    if fiszka.admin_notes:
        reply_desc = fiszka.admin_notes
    elif last_rops_message_at:
        reply_desc = "Koordynator odpowiedział w rozmowie poniżej."
    else:
        reply_desc = "Koordynator napisze do Ciebie tutaj i e-mailem."

    steps = [
        TimelineStep(key="sent", label="Wysłano", description="Twoje zgłoszenie trafiło do Hubu.",
                     done=True, tone="positive", date=fiszka.created_at),
        TimelineStep(key="received", label="Przyjęte przez ROPS",
                     description="Koordynator przeczytał zgłoszenie." if received else "Czeka na przeczytanie przez koordynatora ROPS.",
                     done=received, tone="positive" if received else "neutral", date=fiszka.read_at),
        TimelineStep(key="review", label="W ocenie", description=review_desc,
                     done=in_review, tone="positive" if in_review else "neutral", date=fiszka.review_started_at),
        TimelineStep(key="decision", label=FISZKA_STATUSES.get(status, "Decyzja") if decided else "Decyzja",
                     description=decision_desc, done=decided,
                     tone=DECISION_TONES.get(status, "neutral") if decided else "neutral", date=fiszka.decided_at),
        TimelineStep(key="reply", label="Odpowiedź koordynatora", description=reply_desc,
                     done=has_reply, tone="positive" if has_reply else "neutral",
                     date=max(reply_dates) if reply_dates else None),
    ]
    return _mark_current(steps)


def build_problem_timeline(report: ProblemReport) -> List[TimelineStep]:
    order = list(PROBLEM_STATUS_LABELS)
    idx = order.index(report.status) if report.status in order else 0
    descriptions = {
        "nowy": "Zgłoszenie trafiło do rejestru wyzwań.",
        "w_analizie": "ROPS i gmina analizują problem.",
        "przypisana_innowacja": "Wskazano sprawdzone rozwiązanie z Biblioteki innowacji.",
        "wdrazany": "Gmina wdraża rozwiązanie.",
        "rozwiazany": "Sprawa zakończona.",
    }
    steps = [
        TimelineStep(key=key, label=label, description=descriptions[key], done=i <= idx,
                     tone="positive" if i <= idx else "neutral", date=report.created_at if i == 0 else None)
        for i, (key, label) in enumerate(PROBLEM_STATUS_LABELS.items())
    ]
    return _mark_current(steps)


async def list_case_messages(db: AsyncSession, case_id: str, case_type: str = "fiszka") -> List[CaseMessage]:
    q = (select(CaseMessage)
         .where(CaseMessage.case_type == case_type, CaseMessage.case_id == case_id)
         .order_by(CaseMessage.created_at.asc()))
    return list((await db.execute(q)).scalars().all())


async def last_rops_message_at(db: AsyncSession, case_id: str) -> Optional[datetime]:
    q = (select(CaseMessage.created_at)
         .where(CaseMessage.case_id == case_id, CaseMessage.sender == "rops")
         .order_by(CaseMessage.created_at.desc()).limit(1))
    return (await db.execute(q)).scalar()


def add_case_message(db: AsyncSession, case_id: str, sender: str, body: str, case_type: str = "fiszka") -> CaseMessage:
    message = CaseMessage(
        id=f"msg-{uuid.uuid4().hex[:10]}",
        case_type=case_type,
        case_id=case_id,
        sender=sender,
        body=body,
        read_by_rops=(sender == "rops"),
        created_at=datetime.utcnow(),
    )
    db.add(message)
    return message


def emails_match(a: Optional[str], b: Optional[str]) -> bool:
    return bool(a and b) and a.strip().lower() == b.strip().lower()
