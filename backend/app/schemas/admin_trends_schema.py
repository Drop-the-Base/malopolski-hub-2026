from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class PoviatTrendMetric(BaseModel):
    powiat: str
    top_problem_category: str
    reported_cases_count: int
    quarterly_growth_pct: float
    alert_level: str

class TrendRadarSummary(BaseModel):
    total_problems_analyzed: int
    most_acute_challenges: List[Dict[str, Any]]
    poviat_breakdown: List[PoviatTrendMetric]
    systemic_gaps: List[str]

class SubmissionStatusUpdate(BaseModel):
    new_status: str
    admin_feedback: Optional[str] = None
    assigned_mentor_id: Optional[str] = None
