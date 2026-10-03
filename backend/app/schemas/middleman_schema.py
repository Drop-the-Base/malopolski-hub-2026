from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AdaptationRequest(BaseModel):
    innovation_id: str
    municipality_name: str
    powiat: str
    population: int = 5000
    senior_percentage: float = 25.0
    annual_budget_pln: int = 80000
    has_cus: bool = False

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

class AdaptationResponse(BaseModel):
    blueprint: ServiceBlueprint
    generated_at: str

class ETRRequest(BaseModel):
    source_text: str = Field(..., min_length=5)

class ETRResponse(BaseModel):
    simple_text: str
    key_points: List[str]
    reading_ease_score: int
