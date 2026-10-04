"""Schematy subskrypcji powiadomień (G5) i zarządzania naborami w Panelu ROPS."""
from datetime import date, datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from app.core.constants import normalize_category, normalize_powiat
from app.schemas.idea_schema import EMAIL_PATTERN, GrantCall

SUBSCRIPTION_TOPICS = {
    "innowacje": "Nowe innowacje w Bibliotece",
    "nabory": "Nowe i zmienione nabory grantowe",
}


class SubscriptionCreate(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN, max_length=200)
    topics: List[str] = Field(..., min_length=1, description="'innowacje' i/lub 'nabory'")
    categories: List[str] = Field(default_factory=list, description="Pusta lista = wszystkie kategorie")
    powiaty: List[str] = Field(default_factory=list, description="Pusta lista = cała Małopolska")
    rodo_consent: bool

    @field_validator("topics")
    @classmethod
    def _topics(cls, v: List[str]) -> List[str]:
        unknown = [t for t in v if t not in SUBSCRIPTION_TOPICS]
        if unknown:
            raise ValueError(f"Nieznany temat powiadomień: {', '.join(unknown)}. Dozwolone: innowacje, nabory")
        return sorted(set(v))

    @field_validator("categories")
    @classmethod
    def _categories(cls, v: List[str]) -> List[str]:
        return sorted({normalize_category(c) for c in v if c and c.strip()})

    @field_validator("powiaty")
    @classmethod
    def _powiaty(cls, v: List[str]) -> List[str]:
        return sorted({normalize_powiat(p) for p in v if p and p.strip()})

    @field_validator("rodo_consent")
    @classmethod
    def _consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Zaznacz zgodę na przetwarzanie adresu e-mail – bez niej nie możemy wysyłać powiadomień.")
        return v


class SubscriptionResponse(BaseModel):
    message: str
    email_masked: str
    topics: List[str]
    categories: List[str]
    powiaty: List[str]
    is_update: bool


class SubscriptionInfo(BaseModel):
    """Podgląd subskrypcji po tokenie z linku w e-mailu (adres częściowo ukryty)."""
    email_masked: str
    topics: List[str]
    categories: List[str]
    powiaty: List[str]
    is_active: bool


class CountItem(BaseModel):
    key: str
    label: str
    count: int


class SubscriptionStats(BaseModel):
    """Zbiorcze liczby subskrybentów – bez listy adresów e-mail."""
    active_total: int
    by_topic: List[CountItem]
    by_category: List[CountItem]
    all_categories_count: int
    by_powiat: List[CountItem]
    all_powiaty_count: int
    alerts_sent: int


class GrantCallUpsert(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    opens_on: str = Field(..., description="Data otwarcia RRRR-MM-DD")
    closes_on: str = Field(..., description="Data zamknięcia RRRR-MM-DD")
    min_budget_pln: int = Field(..., ge=0, le=10_000_000)
    max_budget_pln: int = Field(..., ge=0, le=10_000_000)
    criteria: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    powiat: Optional[str] = None

    @field_validator("opens_on", "closes_on")
    @classmethod
    def _date(cls, v: str) -> str:
        try:
            return date.fromisoformat(v.strip()).isoformat()
        except ValueError:
            raise ValueError("Podaj datę w formacie RRRR-MM-DD.")

    @field_validator("criteria")
    @classmethod
    def _criteria(cls, v: List[str]) -> List[str]:
        return [c.strip() for c in v if c and c.strip()]

    @field_validator("category")
    @classmethod
    def _category(cls, v: Optional[str]) -> Optional[str]:
        return normalize_category(v)

    @field_validator("powiat")
    @classmethod
    def _powiat(cls, v: Optional[str]) -> Optional[str]:
        return normalize_powiat(v)

    @model_validator(mode="after")
    def _ranges(self):
        if self.closes_on < self.opens_on:
            raise ValueError("Data zamknięcia naboru nie może być wcześniejsza niż data otwarcia.")
        if self.max_budget_pln < self.min_budget_pln:
            raise ValueError("Maksymalna kwota nie może być mniejsza niż minimalna.")
        return self


class GrantCallAdminResponse(BaseModel):
    call: GrantCall
    notified_count: int
    message: str
