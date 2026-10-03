from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class FiszkaCreate(BaseModel):
    title: str = Field(..., min_length=3)
    summary: str = Field(..., min_length=10)
    target_audience: str
    implementation_stage: str = "pomysl"
    author_name: str
    author_email: str
    author_type: str = "mieszkaniec"
    powiat: str

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
    created_at: datetime

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

class GrantApplicationRequest(BaseModel):
    call_title: str = "Nabór Grantowy ROPS Kraków - Innowacje Społeczne 2026"
    fiszka_id: Optional[str] = None
    idea_title: str
    summary: str
    target_group: str
    powiat: Optional[str] = "Kraków"
    gmina: Optional[str] = None
    author_name: Optional[str] = "Wnioskodawca Małopolski"
    requested_budget_pln: int = 50000
    canvas_data: Optional[Dict[str, str]] = None

class GrantApplicationResponse(BaseModel):
    application_id: str
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
    prompt: str = Field(..., min_length=4, description="Krótki opis lub jedno zdanie o pomyśle")
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
