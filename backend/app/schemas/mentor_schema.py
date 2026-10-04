"""Panel eksperta / mentora (G15): logowanie demo, kolejka fiszek, pytania z Dialogu, konsultacje i opinie."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.case_schema import CaseMessageItem
from app.schemas.communication_schema import MentorProfile, MessageItem


class MentorLoginRequest(BaseModel):
    mentor_id: str = Field(..., min_length=1, max_length=100)
    access_code: str = Field(..., min_length=1, max_length=200)


class MentorLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    mentor: MentorProfile


class MentorTextCreate(BaseModel):
    body: str = Field(..., min_length=10, max_length=4000)

    @field_validator("body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Wiadomość jest za krótka (minimum 10 znaków).")
        return v


class MentorFiszkaItem(BaseModel):
    """Fiszka przydzielona mentorowi – bez adresu e-mail autora (kontakt idzie przez wątek sprawy)."""
    id: str
    title: str
    summary: str
    target_audience: str
    implementation_stage: str
    powiat: str
    status: str
    status_label: str
    author_name: str
    author_type: Optional[str] = None
    cluster_group: Optional[str] = None
    created_at: datetime
    messages: List[CaseMessageItem]
    my_feedback_count: int
    last_feedback_at: Optional[datetime] = None


class MentorThreadItem(BaseModel):
    id: str
    title: str
    category: str
    category_label: str
    powiat: str
    author_name: str
    author_role: str
    status: str
    created_at: datetime
    messages: List[MessageItem]
    matches_specialization: bool
    answered_by_me: bool
    needs_answer: bool


class MentorBookingItem(BaseModel):
    id: str
    slot_start: datetime
    slot_end: datetime
    requester_name: str
    requester_email: str
    topic: str
    upcoming: bool


class MentorStats(BaseModel):
    assigned_fiszki: int
    waiting_for_feedback: int
    feedback_sent: int
    thread_replies: int
    open_threads: int
    upcoming_bookings: int


class MentorDashboard(BaseModel):
    mentor: MentorProfile
    stats: MentorStats
    fiszki: List[MentorFiszkaItem]
    threads: List[MentorThreadItem]
    bookings: List[MentorBookingItem]


class MentorActivityItem(BaseModel):
    mentor_id: str
    full_name: str
    specialization: str
    assigned_fiszki: int
    feedback_sent: int
    thread_replies: int
    upcoming_bookings: int
    total_bookings: int
    last_activity_at: Optional[datetime] = None


class MentorActivitySummary(BaseModel):
    mentors: List[MentorActivityItem]
    total_feedback: int
    total_thread_replies: int
    fiszki_without_feedback: int
