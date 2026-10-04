"""Schematy „Moje sprawy”: weryfikacja autora, wątek wiadomości, status zgłoszeń z rejestru i liczniki panelu ROPS."""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.idea_schema import EMAIL_PATTERN, FiszkaPublicStatus, TimelineStep


class CaseAccessRequest(BaseModel):
    """Autor potwierdza, że to jego sprawa – podaje adres e-mail użyty przy zgłoszeniu."""
    email: str = Field(..., pattern=EMAIL_PATTERN, max_length=200)


class AuthorMessageCreate(CaseAccessRequest):
    body: str = Field(..., min_length=3, max_length=2000)

    @field_validator("body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Wiadomość jest za krótka (minimum 3 znaki).")
        return v


class RopsMessageCreate(BaseModel):
    body: str = Field(..., min_length=3, max_length=4000)

    @field_validator("body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Odpowiedź jest za krótka (minimum 3 znaki).")
        return v


class CaseMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender: str  # 'author' | 'rops' | 'mentor'
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    body: str
    read_by_rops: bool = False
    created_at: datetime


class FiszkaCaseView(BaseModel):
    """Pełny widok sprawy dla zweryfikowanego autora: status, oś czasu i wątek z ROPS."""
    status: FiszkaPublicStatus
    messages: List[CaseMessageItem]


class ProblemPublicStatus(BaseModel):
    """Publiczny status zgłoszenia z Rejestru wyzwań (bez danych zgłaszającego)."""
    id: str
    title: Optional[str] = None
    powiat: Optional[str] = None
    gmina: Optional[str] = None
    status: str
    status_label: str
    assigned_innovation_id: Optional[str] = None
    assigned_innovation_title: Optional[str] = None
    created_at: datetime
    timeline: List[TimelineStep] = []


class AdminInboxSummary(BaseModel):
    """Liczniki dla koordynatora: nowe (nieprzyjęte) fiszki i nieprzeczytane pytania autorów."""
    new_submissions: int
    new_submission_ids: List[str]
    unread_messages: int
    unread_by_case: Dict[str, int]
    unread_notifications: int
    total_attention: int
