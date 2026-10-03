from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from app.core.constants import normalize_powiat, normalize_category

class MatchmakingRequest(BaseModel):
    problem_description: str = Field(..., min_length=5, max_length=4000, description="Opis problemu społecznego")
    powiat: Optional[str] = Field(None, description="Nazwa powiatu w Małopolsce (puste = cała Małopolska)")
    category: Optional[str] = Field(None, description="Kategoria tematyczna")
    limit: int = Field(default=4, ge=1, le=10)

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

    @field_validator("category")
    @classmethod
    def _category(cls, v):
        return normalize_category(v)

class InnovationMatchItem(BaseModel):
    innovation_id: str
    title: str
    tagline: str
    match_score: float
    why_matched: str
    readiness_level: str
    category: str
    category_label: str
    target_groups: List[str]
    matched_needs: List[str] = Field(default_factory=list, description="Potrzeby ze zgłoszenia, na które odpowiada innowacja")
    etr_summary: Optional[str] = None
    video_url: Optional[str] = None
    handbook_url: Optional[str] = None

class MatchmakingResponse(BaseModel):
    clean_query: str
    detected_topics: List[str]
    powiat: Optional[str]
    matches: List[InnovationMatchItem]
    no_match: bool = False
    similar_cases_count: int
    trend_alert: Optional[str] = None
    ceneo_intro: str = Field(..., description="Empatyczne podsumowanie problemu")
    ceneo_bundle_rationale: str = Field(..., description="Dlaczego te innowacje tworzą spójny zestaw")
    action_steps: List[str] = Field(default_factory=list, description="Lista 3 kroków działania")
    ai_generated: bool = Field(False, description="Czy uzasadnienia wygenerował model językowy")
