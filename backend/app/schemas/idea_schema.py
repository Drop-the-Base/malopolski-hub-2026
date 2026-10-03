from pydantic import BaseModel, Field, field_validator
from app.core.constants import normalize_powiat
from typing import List, Optional, Dict, Any
from datetime import datetime

EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

IMPLEMENTATION_STAGES = {
    "pomysl": "Pomysł (koncepcja)",
    "prototyp": "Prototyp / pierwsze testy",
    "pilotaz": "Pilotaż w społeczności",
    "wdrozenie": "Wdrożenie / skalowanie",
}
AUTHOR_TYPES = {"mieszkaniec", "ngo", "grupa_nieformalna", "jst", "ekspert"}
FISZKA_STATUSES = {
    "submitted": "Złożona",
    "in_review": "W weryfikacji ROPS",
    "in_testing": "W fazie testów i głosowania",
    "needs_changes": "Do uzupełnienia",
    "approved": "Zaakceptowana",
    "rejected": "Odrzucona",
}

class FiszkaCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=160)
    summary: str = Field(..., min_length=10, max_length=4000)
    target_audience: str = Field(..., min_length=2, max_length=300)
    implementation_stage: str = "pomysl"
    author_name: str = Field(..., min_length=2, max_length=120)
    author_email: str = Field(..., pattern=EMAIL_PATTERN, max_length=200)
    author_type: str = "mieszkaniec"
    powiat: str
    rodo_consent: bool = Field(..., description="Zgoda na przetwarzanie danych kontaktowych (RODO)")

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

    @field_validator("implementation_stage")
    @classmethod
    def _stage(cls, v):
        if v not in IMPLEMENTATION_STAGES:
            raise ValueError(f"Nieznany etap realizacji. Dozwolone: {', '.join(IMPLEMENTATION_STAGES)}")
        return v

    @field_validator("author_type")
    @classmethod
    def _author_type(cls, v):
        if v not in AUTHOR_TYPES:
            raise ValueError(f"Nieznany typ autora. Dozwolone: {', '.join(sorted(AUTHOR_TYPES))}")
        return v

    @field_validator("rodo_consent")
    @classmethod
    def _consent(cls, v):
        if not v:
            raise ValueError("Wymagana zgoda na przetwarzanie danych osobowych.")
        return v

class FiszkaResponse(BaseModel):
    id: str
    title: str
    summary: str
    target_audience: str
    implementation_stage: str
    author_name: str
    author_email: str
    author_type: str
    powiat: str
    status: str
    admin_notes: Optional[str] = None
    assigned_mentor_id: Optional[str] = None
    cluster_group: Optional[str] = None
    votes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

class FiszkaPublicStatus(BaseModel):
    """Publiczny podgląd statusu fiszki dla autora i modułu głosowania."""
    id: str
    title: str
    summary: Optional[str] = None
    powiat: Optional[str] = None
    target_audience: Optional[str] = None
    status: str
    status_label: str
    implementation_stage: str
    admin_notes: Optional[str] = None
    mentor_name: Optional[str] = None
    cluster_group: Optional[str] = None
    votes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

class FiszkaModeration(BaseModel):
    status: str
    admin_notes: Optional[str] = Field(None, max_length=4000, description="Komentarz przekazywany autorowi")
    assigned_mentor_id: Optional[str] = None

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v not in FISZKA_STATUSES:
            raise ValueError(f"Nieznany status. Dozwolone: {', '.join(FISZKA_STATUSES)}")
        return v

class FiszkaUpdate(BaseModel):
    """Pełna aktualizacja wniosku przez koordynatora/urzędnika ROPS."""
    title: Optional[str] = Field(None, min_length=3, max_length=160)
    summary: Optional[str] = Field(None, min_length=10, max_length=4000)
    target_audience: Optional[str] = Field(None, min_length=2, max_length=300)
    implementation_stage: Optional[str] = None
    powiat: Optional[str] = None
    cluster_group: Optional[str] = None
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    assigned_mentor_id: Optional[str] = None

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v):
        if v is not None and v not in FISZKA_STATUSES:
            raise ValueError(f"Nieznany status. Dozwolone: {', '.join(FISZKA_STATUSES)}")
        return v

class IdeaVoteResponse(BaseModel):
    id: str
    title: str
    votes_count: int
    message: str

class CanvasSubmission(BaseModel):
    fiszka_id: Optional[str] = None
    problem: str
    target_group: str
    value_proposition: str
    barriers: str
    resources: str
    partners: str
    testing_plan: str
    metrics: str
    scalability: str

class CanvasAuditResponse(BaseModel):
    overall_score: int
    strengths: List[str]
    logic_gaps: List[str]
    coaching_tips: List[str]
    visual_concept_prompt: str

class GrantCall(BaseModel):
    id: str
    title: str
    opens_on: str
    closes_on: str
    min_budget_pln: int
    max_budget_pln: int
    criteria: List[str]
    is_open: bool

class GrantApplicationRequest(BaseModel):
    call_id: str = Field(..., description="Identyfikator naboru (GET /grant-calls)")
    fiszka_id: Optional[str] = None
    idea_title: str = Field(..., min_length=3, max_length=200)
    summary: str = Field(..., min_length=10, max_length=4000)
    target_group: str = Field(..., min_length=2, max_length=300)
    powiat: Optional[str] = None
    gmina: Optional[str] = Field(None, max_length=120)
    author_name: Optional[str] = Field("Wnioskodawca", max_length=160)
    requested_budget_pln: int = Field(50000, ge=1000, le=1_000_000)
    canvas_data: Optional[Dict[str, str]] = None

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

class GrantApplicationResponse(BaseModel):
    application_id: str
    call_id: str
    completeness_pct: int
    missing_elements: List[str]
    call_title: str
    submission_date: str
    applicant_name: str
    powiat: str
    gmina: Optional[str] = None
    target_group: str
    idea_title: str
    executive_summary: str
    problem_diagnosis: str
    detailed_methodology: str
    budget_breakdown: Dict[str, int]
    total_budget_pln: int
    monitoring_indicators: List[str]
    risk_assessment: List[Dict[str, str]]
    declarations: List[str]

class CanvasAutofillRequest(BaseModel):
    prompt: str = Field(..., min_length=4, max_length=1500, description="Krótki opis lub jedno zdanie o pomyśle")
    powiat: Optional[str] = "Kraków"
    target_group: Optional[str] = None

class CanvasAutofillResponse(BaseModel):
    idea_title: str
    problem: str
    target_group: str
    value_proposition: str
    barriers: str
    resources: str
    partners: str
    testing_plan: str
    metrics: str
    scalability: str
    ai_powered: bool
    latency_ms: int
