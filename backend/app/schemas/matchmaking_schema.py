from pydantic import BaseModel, Field, field_validator
from datetime import datetime
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
    matched_keywords: List[str] = Field(
        default_factory=list,
        description="Słowa z opisu użytkownika, które zdecydowały o dopasowaniu (np. 'samotni', 'seniorzy', 'wsi')",
    )
    etr_summary: Optional[str] = None
    video_url: Optional[str] = None
    handbook_url: Optional[str] = None

class KeywordHighlight(BaseModel):
    """Fragment opisu (`clean_query[start:end]`), który wpłynął na wynik."""
    start: int
    end: int
    text: str
    reasons: List[str] = Field(default_factory=list, description="Rozpoznane potrzeby lub innowacja, z którą słowo się pokrywa")

class SimilarReportGroup(BaseModel):
    """Zagregowane podobne zgłoszenia z jednego powiatu – bez treści zapytań mieszkańców i danych osobowych."""
    powiat: Optional[str] = None
    powiat_label: str
    count: int
    registry_count: int = Field(0, description="W tym wpisy Rejestru Wyzwań gmin (pozostałe: anonimowe zapytania Matchmakingu)")
    last_reported_at: Optional[datetime] = None
    example_titles: List[str] = Field(default_factory=list, description="Tytuły wpisów Rejestru Wyzwań (zanonimizowane)")
    is_user_powiat: bool = False

class MatchmakingResponse(BaseModel):
    clean_query: str
    detected_topics: List[str]
    powiat: Optional[str]
    matches: List[InnovationMatchItem]
    no_match: bool = False
    similar_cases_count: int
    trend_alert: Optional[str] = None
    highlights: List[KeywordHighlight] = Field(default_factory=list, description="Słowa kluczowe w `clean_query`")
    similar_reports: List[SimilarReportGroup] = Field(default_factory=list, description="Podobne zgłoszenia z regionu")
    similar_reports_total: int = 0
    ceneo_intro: str = Field(..., description="Empatyczne podsumowanie problemu")
    ceneo_bundle_rationale: str = Field(..., description="Dlaczego te innowacje tworzą spójny zestaw")
    action_steps: List[str] = Field(default_factory=list, description="Lista 3 kroków działania")
    ai_generated: bool = Field(False, description="Czy uzasadnienia wygenerował model językowy")
