"""
Panel eksperta / mentora (G15).

Mentor widzi: fiszki przydzielone przez koordynatora ROPS, otwarte wątki Dialogu w swoim obszarze
(konsultacje mentorskie + pytania pasujące do specjalizacji) i zarezerwowane konsultacje.
Opinia mentora trafia do wątku sprawy (`case_messages`) – autor widzi ją w „Moich sprawach” z podpisem
i dostaje e-mail przez skrzynkę nadawczą; koordynator dostaje powiadomienie w panelu.
"""
import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Set
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.constants import strip_diacritics
from app.models.case_message import CaseMessage
from app.models.communication import CommunicationThread, Mentor, MentorBooking, ThreadMessage
from app.models.idea_fiszka import IdeaFiszka
from app.schemas.case_schema import CaseMessageItem
from app.schemas.communication_schema import THREAD_CATEGORIES, MentorProfile, MessageItem
from app.schemas.idea_schema import FISZKA_STATUSES
from app.schemas.mentor_schema import (
    MentorActivityItem,
    MentorActivitySummary,
    MentorBookingItem,
    MentorDashboard,
    MentorFiszkaItem,
    MentorStats,
    MentorThreadItem,
)
from app.services.communication_service import SLOT_MINUTES
from app.services.notification_service import ADMIN_RECIPIENT, notify

# Dodatkowe słowa-klucze obszarów demonstracyjnych mentorów (uzupełniają słowa ze specjalizacji)
MENTOR_TOPIC_HINTS: Dict[str, List[str]] = {
    "mentor-001": ["senior", "opiek", "wytchn", "samotn", "sasiedz", "uslug"],
    "mentor-002": ["dostep", "architekt", "wcag", "niepelnospr", "barier", "urzad"],
    "mentor-003": ["grant", "partner", "nabor", "efs", "fundusz", "ngo", "wniosek", "finans"],
}
ALWAYS_FOR_MENTORS = {"konsultacja_mentorska"}
CLOSED_THREAD_STATUSES = {"resolved", "closed"}
OPEN_FISZKA_STATUSES = {"submitted", "in_review", "needs_changes", "in_testing", "approved"}
_STEM = 5


def _stems(text: str) -> Set[str]:
    words = re.findall(r"[a-z0-9]+", strip_diacritics((text or "").lower()))
    return {w[:_STEM] for w in words if len(w) >= 3}


def mentor_topic_stems(mentor: Mentor) -> Set[str]:
    hints = {strip_diacritics(h.lower())[:_STEM] for h in MENTOR_TOPIC_HINTS.get(mentor.id, [])}
    spec = {s for s in _stems(mentor.specialization) if len(s) >= 4}
    return spec | hints


def thread_matches(thread: CommunicationThread, stems: Set[str]) -> bool:
    first = sorted(thread.messages, key=lambda m: m.created_at or datetime.min)[:1]
    text = " ".join([thread.title] + [m.content for m in first])
    return bool(_stems(text) & stems)


def mentor_profile(mentor: Mentor) -> MentorProfile:
    return MentorProfile(
        id=mentor.id, full_name=mentor.full_name, specialization=mentor.specialization, bio=mentor.bio,
        available_hours=mentor.available_hours, contact_email=mentor.contact_email, avatar_url=mentor.avatar_url,
    )


def mentor_signature_role(mentor: Mentor) -> str:
    return f"Mentor ROPS – {mentor.specialization}"


async def get_mentor_or_404(db: AsyncSession, mentor_id: str) -> Mentor:
    mentor = await db.get(Mentor, mentor_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Nie znaleziono mentora.")
    return mentor


async def _fiszka_item(db: AsyncSession, fiszka: IdeaFiszka, mentor_id: str) -> MentorFiszkaItem:
    messages = list((await db.execute(
        select(CaseMessage).where(CaseMessage.case_type == "fiszka", CaseMessage.case_id == fiszka.id)
        .order_by(CaseMessage.created_at.asc())
    )).scalars().all())
    mine = [m for m in messages if m.sender == "mentor" and m.mentor_id == mentor_id]
    return MentorFiszkaItem(
        id=fiszka.id, title=fiszka.title, summary=fiszka.summary, target_audience=fiszka.target_audience,
        implementation_stage=fiszka.implementation_stage or "pomysl", powiat=fiszka.powiat,
        status=fiszka.status or "submitted", status_label=FISZKA_STATUSES.get(fiszka.status, fiszka.status),
        author_name=fiszka.author_name, author_type=fiszka.author_type, cluster_group=fiszka.cluster_group,
        created_at=fiszka.created_at, messages=[CaseMessageItem.model_validate(m) for m in messages],
        my_feedback_count=len(mine), last_feedback_at=mine[-1].created_at if mine else None,
    )


def _thread_item(thread: CommunicationThread, mentor: Mentor, stems: Set[str]) -> MentorThreadItem:
    messages = sorted(thread.messages, key=lambda m: m.created_at or datetime.min)
    expert_answered = any(m.sender_role in ("mentor", "rops_ekspert") for m in messages)
    return MentorThreadItem(
        id=thread.id, title=thread.title, category=thread.category,
        category_label=THREAD_CATEGORIES.get(thread.category, thread.category), powiat=thread.powiat,
        author_name=thread.author_name, author_role=thread.author_role, status=thread.status or "open",
        created_at=thread.created_at,
        messages=[MessageItem(id=m.id, sender_name=m.sender_name, sender_role=m.sender_role, content=m.content,
                              created_at=m.created_at) for m in messages],
        matches_specialization=thread_matches(thread, stems),
        answered_by_me=any(m.mentor_id == mentor.id for m in messages),
        needs_answer=not expert_answered,
    )


async def _load_thread(db: AsyncSession, thread_id: str):
    return (await db.execute(
        select(CommunicationThread).options(selectinload(CommunicationThread.messages))
        .where(CommunicationThread.id == thread_id).execution_options(populate_existing=True)
    )).scalar_one_or_none()


async def mentor_threads(db: AsyncSession, mentor: Mentor) -> List[MentorThreadItem]:
    threads = (await db.execute(
        select(CommunicationThread).options(selectinload(CommunicationThread.messages))
        .order_by(CommunicationThread.created_at.desc())
    )).scalars().all()
    stems = mentor_topic_stems(mentor)
    items = [
        _thread_item(t, mentor, stems) for t in threads
        if (t.status or "open") not in CLOSED_THREAD_STATUSES
        and (t.category in ALWAYS_FOR_MENTORS or thread_matches(t, stems))
    ]
    # Najpierw wątki bez odpowiedzi eksperta, potem pasujące do specjalizacji
    items.sort(key=lambda i: (not i.needs_answer, not i.matches_specialization))
    return items


async def mentor_dashboard(db: AsyncSession, mentor_id: str) -> MentorDashboard:
    mentor = await get_mentor_or_404(db, mentor_id)
    fiszki_rows = (await db.execute(
        select(IdeaFiszka).where(IdeaFiszka.assigned_mentor_id == mentor.id).order_by(IdeaFiszka.updated_at.desc())
    )).scalars().all()
    fiszki = [await _fiszka_item(db, f, mentor.id) for f in fiszki_rows]
    fiszki.sort(key=lambda f: f.my_feedback_count > 0)  # czekające na pierwszą opinię na górze
    threads = await mentor_threads(db, mentor)

    now = datetime.now()
    bookings_rows = (await db.execute(
        select(MentorBooking).where(MentorBooking.mentor_id == mentor.id).order_by(MentorBooking.slot_start.asc())
    )).scalars().all()
    upcoming = [b for b in bookings_rows if b.slot_start >= now]
    past = list(reversed([b for b in bookings_rows if b.slot_start < now]))
    bookings = [
        MentorBookingItem(
            id=b.id, slot_start=b.slot_start, slot_end=b.slot_start + timedelta(minutes=SLOT_MINUTES),
            requester_name=b.requester_name, requester_email=b.requester_email, topic=b.topic,
            upcoming=b.slot_start >= now,
        )
        for b in upcoming + past
    ]

    thread_replies = (await db.execute(
        select(func.count(ThreadMessage.id)).where(ThreadMessage.mentor_id == mentor.id)
    )).scalar() or 0
    stats = MentorStats(
        assigned_fiszki=len(fiszki),
        waiting_for_feedback=sum(1 for f in fiszki if f.my_feedback_count == 0 and f.status in OPEN_FISZKA_STATUSES),
        feedback_sent=sum(f.my_feedback_count for f in fiszki),
        thread_replies=thread_replies,
        open_threads=sum(1 for t in threads if t.needs_answer),
        upcoming_bookings=len(upcoming),
    )
    return MentorDashboard(mentor=mentor_profile(mentor), stats=stats, fiszki=fiszki, threads=threads, bookings=bookings)


async def send_fiszka_feedback(db: AsyncSession, mentor_id: str, fiszka_id: str, body: str) -> MentorFiszkaItem:
    mentor = await get_mentor_or_404(db, mentor_id)
    fiszka = await db.get(IdeaFiszka, fiszka_id)
    if not fiszka:
        raise HTTPException(status_code=404, detail="Nie znaleziono fiszki o podanym numerze.")
    if fiszka.assigned_mentor_id != mentor.id:
        raise HTTPException(status_code=403, detail="Ta fiszka nie jest przydzielona Tobie. Opinię wysyła tylko przydzielony mentor.")
    now = datetime.utcnow()
    db.add(CaseMessage(
        id=f"msg-{uuid.uuid4().hex[:10]}", case_type="fiszka", case_id=fiszka.id, sender="mentor",
        sender_name=mentor.full_name, sender_role=mentor_signature_role(mentor), mentor_id=mentor.id,
        body=body, read_by_rops=True, created_at=now,
    ))
    if fiszka.read_at is None:
        fiszka.read_at = now
    if fiszka.review_started_at is None:
        fiszka.review_started_at = now
    fiszka.updated_at = now
    await notify(
        db, fiszka.author_email,
        subject=f"Opinia mentora w sprawie {fiszka.id}",
        body=(f"{mentor.full_name} ({mentor.specialization}) przekazał(a) opinię o Twoim pomyśle „{fiszka.title}”:\n\n"
              f"{body}\n\nCałą rozmowę zobaczysz i odpowiesz tutaj: /status/{fiszka.id}"),
        related_type="fiszka", related_id=fiszka.id,
    )
    preview = body if len(body) <= 300 else body[:297] + "…"
    await notify(
        db, ADMIN_RECIPIENT,
        subject=f"Opinia mentora: {fiszka.title}",
        body=f"{mentor.full_name}, {fiszka.id}: {preview}",
        related_type="mentor_feedback", related_id=fiszka.id,
    )
    await db.commit()
    return await _fiszka_item(db, fiszka, mentor.id)


async def reply_to_thread(db: AsyncSession, mentor_id: str, thread_id: str, body: str) -> MentorThreadItem:
    mentor = await get_mentor_or_404(db, mentor_id)
    thread = await _load_thread(db, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Wątek nie istnieje.")
    if (thread.status or "open") in CLOSED_THREAD_STATUSES:
        raise HTTPException(status_code=409, detail="Ten wątek jest zamknięty.")
    db.add(ThreadMessage(
        id=f"msg-{uuid.uuid4().hex[:8]}", thread_id=thread.id, sender_name=mentor.full_name, sender_role="mentor",
        content=body, mentor_id=mentor.id, created_at=datetime.utcnow(),
    ))
    await db.commit()
    thread = await _load_thread(db, thread_id)
    return _thread_item(thread, mentor, mentor_topic_stems(mentor))


async def mentor_activity(db: AsyncSession) -> MentorActivitySummary:
    mentors = (await db.execute(select(Mentor).order_by(Mentor.full_name))).scalars().all()
    assigned = {m: c for m, c in (await db.execute(
        select(IdeaFiszka.assigned_mentor_id, func.count(IdeaFiszka.id))
        .where(IdeaFiszka.assigned_mentor_id.is_not(None)).group_by(IdeaFiszka.assigned_mentor_id)
    )).all()}
    feedback = {m: (c, last) for m, c, last in (await db.execute(
        select(CaseMessage.mentor_id, func.count(CaseMessage.id), func.max(CaseMessage.created_at))
        .where(CaseMessage.sender == "mentor", CaseMessage.mentor_id.is_not(None)).group_by(CaseMessage.mentor_id)
    )).all()}
    replies = {m: (c, last) for m, c, last in (await db.execute(
        select(ThreadMessage.mentor_id, func.count(ThreadMessage.id), func.max(ThreadMessage.created_at))
        .where(ThreadMessage.mentor_id.is_not(None)).group_by(ThreadMessage.mentor_id)
    )).all()}
    now = datetime.now()
    bookings_rows = (await db.execute(select(MentorBooking.mentor_id, MentorBooking.slot_start))).all()

    items = []
    for m in mentors:
        fb_count, fb_last = feedback.get(m.id, (0, None))
        rp_count, rp_last = replies.get(m.id, (0, None))
        own = [s for mid, s in bookings_rows if mid == m.id]
        last = max([d for d in (fb_last, rp_last) if d], default=None)
        items.append(MentorActivityItem(
            mentor_id=m.id, full_name=m.full_name, specialization=m.specialization,
            assigned_fiszki=assigned.get(m.id, 0), feedback_sent=fb_count, thread_replies=rp_count,
            upcoming_bookings=sum(1 for s in own if s >= now), total_bookings=len(own), last_activity_at=last,
        ))

    with_feedback = set((await db.execute(
        select(CaseMessage.case_id).where(CaseMessage.sender == "mentor").distinct()
    )).scalars().all())
    assigned_ids = (await db.execute(
        select(IdeaFiszka.id).where(IdeaFiszka.assigned_mentor_id.is_not(None))
    )).scalars().all()
    return MentorActivitySummary(
        mentors=items,
        total_feedback=sum(i.feedback_sent for i in items),
        total_thread_replies=sum(i.thread_replies for i in items),
        fiszki_without_feedback=sum(1 for fid in assigned_ids if fid not in with_feedback),
    )
