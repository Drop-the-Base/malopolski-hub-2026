from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class CampaignSummary(BaseModel):
    id: str
    innovation_id: str
    campaign_name: str
    goal_description: str
    tester_profile_needed: str
    slots_total: int
    slots_taken: int
    status: str
    deadline: date

class TesterRegistration(BaseModel):
    campaign_id: str
    tester_name: str
    tester_email: str
    tester_role: str
    motivation: str

class FeedbackSubmission(BaseModel):
    campaign_id: str
    tester_name: str
    tester_role: str
    sus_score: int = Field(..., ge=0, le=100)
    usability_rating: int = Field(..., ge=1, le=5)
    identified_barriers: str
    improvement_proposals: str

class EvaluationReport(BaseModel):
    campaign_id: str
    total_feedbacks: int
    average_sus_score: float
    satisfaction_rate: float
    common_barriers: List[str]
    readiness_for_scaling: bool
