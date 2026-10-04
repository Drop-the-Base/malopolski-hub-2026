from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from app.core.constants import normalize_category, normalize_powiat

class InnovationDetail(BaseModel):
    id: str
    title: str
    tagline: str
    category: str
    category_label: str
    target_groups: List[str]
    full_description: str
    readiness_level: str
    budget_bracket: str
    video_url: Optional[str] = None
    handbook_url: Optional[str] = None
    etr_summary: Optional[str] = None
    origin_poviat: Optional[str] = None
    problem_statement: Optional[str] = None
    effect_description: Optional[str] = None
    is_published: bool
    created_at: datetime

class InnovationUpsert(BaseModel):
    """Dane karty innowacji edytowane przez koordynatora ROPS."""
    title: str = Field(..., min_length=3, max_length=160)
    tagline: str = Field(..., min_length=3, max_length=300)
    category: str
    target_groups: List[str] = Field(default_factory=list, max_length=12)
    full_description: str = Field(..., min_length=20, max_length=8000)
    readiness_level: str = Field("Gotowa do skalowania", max_length=120)
    budget_bracket: str = Field("Średni (20-60k zł)", max_length=120)
    video_url: Optional[str] = Field(None, max_length=500, pattern=r"^https://")
    handbook_url: Optional[str] = Field(None, max_length=500, pattern=r"^https://")
    etr_summary: Optional[str] = Field(None, max_length=2000)
    origin_poviat: Optional[str] = None
    problem_statement: Optional[str] = Field(None, max_length=2000)
    effect_description: Optional[str] = Field(None, max_length=2000)
    is_published: bool = True

    @field_validator("category")
    @classmethod
    def _category(cls, v):
        if not normalize_category(v):
            raise ValueError("Kategoria jest wymagana.")
        return v

    @field_validator("origin_poviat")
    @classmethod
    def _powiat(cls, v):
        return normalize_powiat(v)

    @field_validator("video_url", "handbook_url", "etr_summary", "origin_poviat", "problem_statement", "effect_description", mode="before")
    @classmethod
    def _empty_to_none(cls, v):
        return v or None

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
    is_external: bool = False


class EducationalMaterialAdmin(EducationalMaterial):
    is_published: bool = True
    sort_order: int = 0

class EducationalMaterialUpsert(BaseModel):
    """Materiał edukacyjny edytowany w Panelu ROPS. Link: https://… albo ścieżka w Hubie zaczynająca się od '/'."""
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field("Metodyka", min_length=2, max_length=60)
    description: str = Field("", max_length=1000)
    download_url: str = Field(..., max_length=500, pattern=r"^(https://|/)")
    format: str = Field("Strona zewnętrzna", min_length=2, max_length=60)
    is_published: bool = True
    sort_order: int = Field(0, ge=0, le=999)

class RegionalChallengeUpdate(BaseModel):
    """Szybka edycja wyzwania powiatu na Mapie Wyzwań (wskaźniki liczbowe pochodzą z danych statystycznych)."""
    key_social_challenge: str = Field(..., min_length=3, max_length=300)
    demographic_trend: Optional[str] = Field(None, max_length=60)
