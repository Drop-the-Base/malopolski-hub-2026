from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class InnovationDetail(BaseModel):
    id: str
    title: str
    tagline: str
    category: str
    target_groups: List[str]
    full_description: str
    readiness_level: str
    budget_bracket: str
    video_url: Optional[str] = None
    handbook_url: Optional[str] = None
    etr_summary: Optional[str] = None
    origin_poviat: Optional[str] = None
    is_published: bool
    created_at: datetime

class RegionalChallengeSummary(BaseModel):
    powiat_code: str
    powiat_name: str
    population: int
    senior_share_pct: float
    youth_share_pct: float
    demographic_trend: str
    reported_problems_count: int
    active_innovations_count: int
    key_social_challenge: str

class EducationalMaterial(BaseModel):
    id: str
    title: str
    category: str
    description: str
    download_url: str
    format: str
