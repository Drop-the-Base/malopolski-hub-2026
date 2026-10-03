from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class PoviatTrendMetric(BaseModel):
    powiat: str
    top_problem_category: str
    reported_cases_count: int
    platform_cases_count: int
    quarterly_growth_pct: Optional[float] = None
    alert_level: str
    alert_reason: str

class TrendRadarSummary(BaseModel):
    total_problems_analyzed: int
    baseline_cases_count: int
    platform_cases_count: int
    platform_cases_last_30_days: int
    quarterly_growth_pct: Optional[float] = None
    pending_ideas_count: int
    unread_notifications_count: int
    most_acute_challenges: List[Dict[str, Any]]
    poviat_breakdown: List[PoviatTrendMetric]
    systemic_gaps: List[str]
    methodology_note: str

class SubmissionStatusUpdate(BaseModel):
    new_status: str
    admin_feedback: Optional[str] = None
    assigned_mentor_id: Optional[str] = None

class NotificationItem(BaseModel):
    id: str
    recipient: str
    channel: str
    subject: str
    body: str
    related_type: Optional[str] = None
    related_id: Optional[str] = None
    delivery_status: str
    is_read: bool
    created_at: datetime
