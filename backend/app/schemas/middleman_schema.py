from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from app.core.constants import normalize_powiat

class AdaptationRequest(BaseModel):
    innovation_id: str = Field(..., max_length=60)
    municipality_name: str = Field(..., min_length=2, max_length=120)
    powiat: str
    population: int = Field(5000, ge=100, le=1_000_000, description="Liczba mieszkańców gminy")
    senior_percentage: float = Field(25.0, ge=0, le=100, description="Odsetek mieszkańców 65+")
    annual_budget_pln: int = Field(80000, ge=0, le=100_000_000)
    has_cus: bool = False

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

class RiskItem(BaseModel):
    risk: str
    action: str

class ServiceBlueprint(BaseModel):
    title: str
    summary: str
    operational_steps: List[str]
    estimated_budget: Dict[str, Any]
    staffing_requirements: str
    resolution_draft: str
    risk_mitigation: List[RiskItem]
    disclaimer: str

class AdaptationResponse(BaseModel):
    blueprint: ServiceBlueprint
    generated_at: str

class ETRRequest(BaseModel):
    source_text: str = Field(..., min_length=5, max_length=8000)

class ETRResponse(BaseModel):
    simple_text: str
    key_points: List[str]
    reading_ease_score: int
