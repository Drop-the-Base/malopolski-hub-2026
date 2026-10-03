from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.core.constants import normalize_powiat, normalize_category

REPORTER_TYPES = {"urzednik_jst", "pracownik_ops_cus", "mieszkaniec", "ngo"}
URGENCY_LEVELS = {"krytyczny", "wysoki", "standardowy"}
PROBLEM_STATUSES = {"nowy", "w_analizie", "przypisana_innowacja", "wdrazany", "rozwiazany"}

def _check(value, allowed, label):
    if value is not None and value not in allowed:
        raise ValueError(f"Nieznana wartość pola {label}: '{value}'. Dozwolone: {', '.join(sorted(allowed))}")
    return value
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProblemReportCreate(BaseModel):
    title: str = Field(..., min_length=4, max_length=200, description="Krótki tytuł problemu / wyzwania samorządowego")
    raw_text: str = Field(..., min_length=10, max_length=6000, description="Szczegółowy opis wyzwania w gminie/powiecie")
    category: Optional[str] = None
    powiat: str
    gmina: Optional[str] = Field(None, max_length=120)
    reporter_type: str = "urzednik_jst"
    reporter_name: Optional[str] = Field(None, max_length=120)
    reporter_role: Optional[str] = Field(None, max_length=120)  # np. 'Kierownik GOPS', 'Dyrektor CUS'
    urgency: str = "standardowy"
    affected_count: int = Field(0, ge=0, le=1_000_000)

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

    @field_validator("category")
    @classmethod
    def _category(cls, v):
        return normalize_category(v)

    @field_validator("reporter_type")
    @classmethod
    def _reporter(cls, v):
        return _check(v, REPORTER_TYPES, "reporter_type")

    @field_validator("urgency")
    @classmethod
    def _urgency(cls, v):
        return _check(v, URGENCY_LEVELS, "urgency")

class ProblemReportUpdate(BaseModel):
    status: Optional[str] = None
    urgency: Optional[str] = None
    assigned_innovation_id: Optional[str] = None
    assigned_notes: Optional[str] = Field(None, max_length=4000)

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        return _check(v, PROBLEM_STATUSES, "status")

    @field_validator("urgency")
    @classmethod
    def _urgency(cls, v):
        return _check(v, URGENCY_LEVELS, "urgency")

class ProblemAssignRequest(BaseModel):
    innovation_id: str
    notes: Optional[str] = Field(None, max_length=4000)

class ProblemReportResponse(BaseModel):
    id: str
    title: Optional[str]
    raw_text: str
    clean_text: str
    category: Optional[str]
    powiat: Optional[str]
    gmina: Optional[str]
    reporter_type: str
    reporter_name: Optional[str]
    reporter_role: Optional[str]
    urgency: str
    affected_count: int
    matched_innovations: List[str] = []
    assigned_innovation_id: Optional[str] = None
    assigned_notes: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MunicipalReportSummary(BaseModel):
    powiat: str
    total_challenges: int
    critical_challenges: int
    total_affected_residents: int
    top_categories: List[Dict[str, Any]]
    recommended_innovations: List[Dict[str, Any]]
