from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.communication_schema import ThreadCreate, ThreadDetail, MessageItem, MentorProfile
from app.services.communication_service import get_threads, create_thread, get_thread_by_id, add_message, get_mentors

router = APIRouter()

class MessageCreatePayload(BaseModel):
    sender_name: str
    sender_role: str
    content: str

@router.get("/communication/threads", response_model=List[ThreadDetail], tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def list_threads(category: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    """Wątki dialogu międzysektorowego, Q&A z ROPS i poszukiwania partnerstw."""
    return await get_threads(db, category)

@router.post("/communication/threads", response_model=ThreadDetail, tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def start_thread(req: ThreadCreate, db: AsyncSession = Depends(get_db)):
    """Rozpoczęcie nowego wątku dyskusji lub zapytania do ekspertów."""
    return await create_thread(db, req)

@router.post("/communication/threads/{thread_id}/messages", response_model=MessageItem, tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def reply_thread(thread_id: str, payload: MessageCreatePayload, db: AsyncSession = Depends(get_db)):
    """Dodanie odpowiedzi do wątku."""
    thread = await get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Wątek nie istnieje.")
    return await add_message(db, thread_id, payload.sender_name, payload.sender_role, payload.content)

@router.get("/communication/mentors", response_model=List[MentorProfile], tags=["Moduł V: Platforma Aktywnej Komunikacji"])
async def list_mentors(db: AsyncSession = Depends(get_db)):
    """Baza mentorów regionalnych ROPS Kraków."""
    return await get_mentors(db)
