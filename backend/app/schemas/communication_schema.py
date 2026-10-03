from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from app.core.constants import normalize_powiat

EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

THREAD_CATEGORIES = {
    "rops_qa": "Pytanie do ROPS",
    "poszukiwanie_partnera": "Poszukiwanie partnera",
    "konsultacja_mentorska": "Konsultacja mentorska",
}
PARTICIPANT_ROLES = {
    "mieszkaniec": "Mieszkaniec",
    "ngo": "Organizacja pozarządowa",
    "jst": "Samorząd (JST)",
    "mentor": "Mentor",
    "rops_ekspert": "Ekspert ROPS",
}

class MessageItem(BaseModel):
    id: str
    sender_name: str
    sender_role: str
    content: str
    created_at: datetime

class MessageCreate(BaseModel):
    sender_name: str = Field(..., min_length=2, max_length=120)
    sender_role: str = "mieszkaniec"
    content: str = Field(..., min_length=2, max_length=4000)

    @field_validator("sender_role")
    @classmethod
    def _role(cls, v):
        if v not in PARTICIPANT_ROLES or v == "rops_ekspert":
            raise ValueError(f"Nieznana rola. Dozwolone: mieszkaniec, ngo, jst, mentor")
        return v

class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    category: str
    author_name: str = Field(..., min_length=2, max_length=120)
    author_role: str = "mieszkaniec"
    powiat: str
    initial_message: str = Field(..., min_length=5, max_length=4000)

    @field_validator("category")
    @classmethod
    def _category(cls, v):
        if v not in THREAD_CATEGORIES:
            raise ValueError(f"Nieznana kategoria wątku. Dozwolone: {', '.join(THREAD_CATEGORIES)}")
        return v

    @field_validator("author_role")
    @classmethod
    def _role(cls, v):
        if v not in PARTICIPANT_ROLES or v == "rops_ekspert":
            raise ValueError("Nieznana rola autora.")
        return v

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

class ThreadDetail(BaseModel):
    id: str
    title: str
    category: str
    author_name: str
    author_role: str
    powiat: str
    status: str
    created_at: datetime
    messages: List[MessageItem]

class MentorProfile(BaseModel):
    id: str
    full_name: str
    specialization: str
    bio: str
    available_hours: str
    contact_email: str
    avatar_url: Optional[str] = None

class MentorSlot(BaseModel):
    start: datetime
    end: datetime
    available: bool

class BookingCreate(BaseModel):
    slot_start: datetime
    requester_name: str = Field(..., min_length=2, max_length=120)
    requester_email: str = Field(..., pattern=EMAIL_PATTERN, max_length=200)
    topic: str = Field(..., min_length=5, max_length=1000)
    rodo_consent: bool

    @field_validator("rodo_consent")
    @classmethod
    def _consent(cls, v):
        if not v:
            raise ValueError("Wymagana zgoda na przetwarzanie danych kontaktowych.")
        return v

class BookingConfirmation(BaseModel):
    id: str
    mentor_id: str
    mentor_name: str
    slot_start: datetime
    slot_end: datetime
    topic: str
