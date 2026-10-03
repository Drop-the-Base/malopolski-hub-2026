from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.communication_schema import (
    ThreadCreate, ThreadDetail, MessageItem, MessageCreate, MentorProfile, MentorSlot, BookingCreate, BookingConfirmation
)
from app.services.communication_service import (
    get_threads, create_thread, get_thread_by_id, add_message, get_mentors, get_mentor_slots, book_mentor
)

router = APIRouter()

@router.get("/communication/threads", response_model=List[ThreadDetail], tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def list_threads(category: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    """Wątki dialogu międzysektorowego, Q&A z ROPS i poszukiwania partnerstw."""
    return await get_threads(db, category)

@router.post("/communication/threads", response_model=ThreadDetail, tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def start_thread(req: ThreadCreate, db: AsyncSession = Depends(get_db)):
    """Rozpoczęcie nowego wątku dyskusji lub zapytania do ekspertów."""
    return await create_thread(db, req)

@router.post("/communication/threads/{thread_id}/messages", response_model=MessageItem, tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def reply_thread(thread_id: str, payload: MessageCreate, db: AsyncSession = Depends(get_db)):
    """Dodanie odpowiedzi do wątku (imię i rola są wymagane)."""
    thread = await get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Wątek nie istnieje.")
    return await add_message(db, thread_id, payload.sender_name.strip(), payload.sender_role, payload.content.strip())

@router.get("/communication/mentors", response_model=List[MentorProfile], tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def list_mentors(db: AsyncSession = Depends(get_db)):
    """Baza mentorów regionalnych."""
    return await get_mentors(db)

@router.get("/communication/mentors/{mentor_id}/slots", response_model=List[MentorSlot], tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def mentor_slots(mentor_id: str, db: AsyncSession = Depends(get_db)):
    """Terminy dyżurów mentora na najbliższe 3 tygodnie (60 min) z informacją o dostępności."""
    return await get_mentor_slots(db, mentor_id)

@router.post("/communication/mentors/{mentor_id}/bookings", response_model=BookingConfirmation, tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def create_booking(mentor_id: str, req: BookingCreate, db: AsyncSession = Depends(get_db)):
    """Rezerwacja konsultacji – potwierdzenie trafia e-mailem do zgłaszającego i mentora."""
    return await book_mentor(db, mentor_id, req)
