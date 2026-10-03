from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProblemReportCreate(BaseModel):
    title: str = Field(..., min_length=4, description="Krótki tytuł problemu / wyzwania samorządowego")
    raw_text: str = Field(..., min_length=10, description="Szczegółowy opis wyzwania w gminie/powiecie")
    category: Optional[str] = "seniorzy"
    powiat: str
    gmina: Optional[str] = None
    reporter_type: str = "urzednik_jst"  # 'urzednik_jst', 'pracownik_ops_cus', 'mieszkaniec', 'ngo'
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None  # np. 'Kierownik GOPS', 'Dyrektor CUS', 'Koordynator'
    urgency: str = "standardowy"  # 'krytyczny', 'wysoki', 'standardowy'
    affected_count: int = 0

class ProblemReportUpdate(BaseModel):
    status: Optional[str] = None
    urgency: Optional[str] = None
    assigned_innovation_id: Optional[str] = None
    assigned_notes: Optional[str] = None

class ProblemAssignRequest(BaseModel):
    innovation_id: str
    notes: Optional[str] = None

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
