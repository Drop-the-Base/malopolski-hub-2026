import re
import uuid
from datetime import datetime, timedelta, time as dtime
from typing import List, Optional
from fastapi import HTTPException
from app.core.constants import strip_diacritics
from app.services.notification_service import notify
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.communication import CommunicationThread, ThreadMessage, Mentor, MentorBooking
from app.schemas.communication_schema import (
    ThreadCreate, ThreadDetail, MessageItem, MentorProfile, MentorSlot, BookingCreate, BookingConfirmation
)

async def get_threads(db: AsyncSession, category: Optional[str] = None) -> List[ThreadDetail]:
    query = select(CommunicationThread).options(selectinload(CommunicationThread.messages)).order_by(CommunicationThread.created_at.desc())
    if category:
        query = query.where(CommunicationThread.category == category)
    result = await db.execute(query)
    threads = result.scalars().all()

    output = []
    for t in threads:
        messages = [
            MessageItem(
                id=m.id,
                sender_name=m.sender_name,
                sender_role=m.sender_role,
                content=m.content,
                created_at=m.created_at
            )
            for m in t.messages
        ]
        output.append(
            ThreadDetail(
                id=t.id,
                title=t.title,
                category=t.category,
                author_name=t.author_name,
                author_role=t.author_role,
                powiat=t.powiat,
                status=t.status,
                created_at=t.created_at,
                messages=messages
            )
        )
    return output

async def create_thread(db: AsyncSession, req: ThreadCreate) -> ThreadDetail:
    thread_id = f"thread-{uuid.uuid4().hex[:8]}"
    thread = CommunicationThread(
        id=thread_id,
        title=req.title,
        category=req.category,
        author_name=req.author_name,
        author_role=req.author_role,
        powiat=req.powiat,
        status="open"
    )
    db.add(thread)
    await db.flush()

    msg = ThreadMessage(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        thread_id=thread_id,
        sender_name=req.author_name,
        sender_role=req.author_role,
        content=req.initial_message
    )
    db.add(msg)
    await db.commit()

    return await get_thread_by_id(db, thread_id)

async def get_thread_by_id(db: AsyncSession, thread_id: str) -> Optional[ThreadDetail]:
    query = select(CommunicationThread).options(selectinload(CommunicationThread.messages)).where(CommunicationThread.id == thread_id)
    result = await db.execute(query)
    t = result.scalar_one_or_none()
    if not t:
        return None
    messages = [
        MessageItem(
            id=m.id,
            sender_name=m.sender_name,
            sender_role=m.sender_role,
            content=m.content,
            created_at=m.created_at
        )
        for m in t.messages
    ]
    return ThreadDetail(
        id=t.id,
        title=t.title,
        category=t.category,
        author_name=t.author_name,
        author_role=t.author_role,
        powiat=t.powiat,
        status=t.status,
        created_at=t.created_at,
        messages=messages
    )

async def add_message(db: AsyncSession, thread_id: str, sender_name: str, sender_role: str, content: str) -> MessageItem:
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    msg = ThreadMessage(
        id=msg_id,
        thread_id=thread_id,
        sender_name=sender_name,
        sender_role=sender_role,
        content=content
    )
    db.add(msg)
    await db.commit()
    return MessageItem(
        id=msg.id,
        sender_name=msg.sender_name,
        sender_role=msg.sender_role,
        content=msg.content,
        created_at=msg.created_at
    )

async def get_mentors(db: AsyncSession) -> List[MentorProfile]:
    result = await db.execute(select(Mentor))
    mentors = result.scalars().all()
    return [
        MentorProfile(
            id=m.id,
            full_name=m.full_name,
            specialization=m.specialization,
            bio=m.bio,
            available_hours=m.available_hours,
            contact_email=m.contact_email,
            avatar_url=m.avatar_url
        )
        for m in mentors
    ]


_WEEKDAYS = {"poniedz": 0, "wtor": 1, "srod": 2, "czwart": 3, "piat": 4, "sobot": 5, "niedziel": 6}
SLOT_MINUTES = 60
BOOKING_HORIZON_DAYS = 21


def _parse_availability(text: str):
    """'Środy 16:00 - 19:00' -> (2, 16:00, 19:00). Zwraca None, jeśli nie da się odczytać."""
    norm = strip_diacritics(text.lower())
    day = next((d for prefix, d in _WEEKDAYS.items() if prefix in norm), None)
    hours = re.findall(r"(\d{1,2}):(\d{2})", norm)
    if day is None or len(hours) < 2:
        return None
    start, end = (dtime(int(h), int(m)) for h, m in hours[:2])
    return day, start, end


def _candidate_slots(mentor: Mentor, now: datetime) -> List[datetime]:
    parsed = _parse_availability(mentor.available_hours or "")
    if not parsed:
        return []
    weekday, start, end = parsed
    slots: List[datetime] = []
    for offset in range(1, BOOKING_HORIZON_DAYS + 1):
        day = (now + timedelta(days=offset)).date()
        if day.weekday() != weekday:
            continue
        cursor = datetime.combine(day, start)
        while cursor + timedelta(minutes=SLOT_MINUTES) <= datetime.combine(day, end):
            slots.append(cursor)
            cursor += timedelta(minutes=SLOT_MINUTES)
    return slots


async def get_mentor_slots(db: AsyncSession, mentor_id: str) -> List[MentorSlot]:
    mentor = await db.get(Mentor, mentor_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Nie znaleziono mentora.")
    taken = set((await db.execute(
        select(MentorBooking.slot_start).where(MentorBooking.mentor_id == mentor_id)
    )).scalars().all())
    return [
        MentorSlot(start=s, end=s + timedelta(minutes=SLOT_MINUTES), available=s not in taken)
        for s in _candidate_slots(mentor, datetime.now())
    ]


async def book_mentor(db: AsyncSession, mentor_id: str, req: BookingCreate) -> BookingConfirmation:
    mentor = await db.get(Mentor, mentor_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Nie znaleziono mentora.")
    slot = req.slot_start.replace(tzinfo=None, second=0, microsecond=0)
    if slot not in _candidate_slots(mentor, datetime.now()):
        raise HTTPException(status_code=422, detail="Wybrany termin nie należy do dyżurów mentora.")
    exists = (await db.execute(
        select(MentorBooking.id).where(MentorBooking.mentor_id == mentor_id, MentorBooking.slot_start == slot)
    )).first()
    if exists:
        raise HTTPException(status_code=409, detail="Ten termin został już zarezerwowany. Wybierz inny.")

    booking = MentorBooking(
        id=f"booking-{uuid.uuid4().hex[:8]}",
        mentor_id=mentor_id,
        slot_start=slot,
        requester_name=req.requester_name.strip(),
        requester_email=req.requester_email.strip().lower(),
        topic=req.topic.strip(),
    )
    db.add(booking)
    when = slot.strftime("%d.%m.%Y, godz. %H:%M")
    await notify(db, booking.requester_email, subject=f"Potwierdzenie konsultacji z {mentor.full_name}",
                 body=f"Termin: {when}. Temat: {booking.topic}. Mentor skontaktuje się z Tobą e-mailem.",
                 related_type="booking", related_id=booking.id)
    await notify(db, mentor.contact_email, subject=f"Nowa rezerwacja konsultacji – {when}",
                 body=f"{booking.requester_name} ({booking.requester_email}): {booking.topic}",
                 related_type="booking", related_id=booking.id)
    await db.commit()
    return BookingConfirmation(
        id=booking.id, mentor_id=mentor.id, mentor_name=mentor.full_name,
        slot_start=slot, slot_end=slot + timedelta(minutes=SLOT_MINUTES), topic=booking.topic,
    )
