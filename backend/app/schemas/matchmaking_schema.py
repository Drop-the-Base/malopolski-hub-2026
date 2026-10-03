from pydantic import BaseModel, Field
from typing import List, Optional

class MatchmakingRequest(BaseModel):
    problem_description: str = Field(..., min_length=5, description="Opis problemu społecznego")
    powiat: Optional[str] = Field(None, description="Nazwa powiatu w Małopolsce")
    category: Optional[str] = Field(None, description="Kategoria tematyczna")
    limit: int = Field(default=3, ge=1, le=10)

class InnovationMatchItem(BaseModel):
    innovation_id: str
    title: str
    tagline: str
    match_score: float
    why_matched: str
    readiness_level: str
    category: str
    target_groups: List[str]
    etr_summary: Optional[str] = None
    video_url: Optional[str] = None
    handbook_url: Optional[str] = None

class MatchmakingResponse(BaseModel):
    clean_query: str
    detected_topics: List[str]
    powiat: Optional[str]
    matches: List[InnovationMatchItem]
    similar_cases_count: int
    trend_alert: Optional[str] = None
    ceneo_intro: str = Field(..., description="Ceneo-style conversational empathic summary of the problem")
    ceneo_bundle_rationale: str = Field(..., description="Explanation of why these innovations form a synergistic bundle")
    action_steps: List[str] = Field(default_factory=list, description="Immediate 3-step action checklist")

