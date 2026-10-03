from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import date

EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

TESTER_ROLES = {
    "senior": "Senior / seniorka",
    "opiekun": "Opiekun osoby zależnej",
    "osoba_z_niepelnosprawnoscia": "Osoba z niepełnosprawnością",
    "mlodziez": "Uczeń / młodzież (poniżej 18 lat)",
    "pedagog": "Pedagog / psycholog",
    "pracownik_ops": "Pracownik OPS/CUS",
    "ekspert": "Ekspert / specjalista",
    "mieszkaniec": "Mieszkaniec",
}

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
    tester_name: str = Field(..., min_length=2, max_length=120)
    tester_email: str = Field(..., pattern=EMAIL_PATTERN, max_length=200)
    tester_role: str
    motivation: str = Field("", max_length=2000)
    guardian_consent: bool = Field(False, description="Zgoda rodzica/opiekuna prawnego – wymagana dla osób niepełnoletnich")
    rodo_consent: bool = Field(..., description="Zgoda na przetwarzanie danych kontaktowych w celu organizacji testów")

    @field_validator("tester_role")
    @classmethod
    def _role(cls, v):
        if v not in TESTER_ROLES:
            raise ValueError(f"Nieznana rola testera. Dozwolone: {', '.join(TESTER_ROLES)}")
        return v

    @model_validator(mode="after")
    def _consents(self):
        if not self.rodo_consent:
            raise ValueError("Wymagana zgoda na przetwarzanie danych osobowych.")
        if self.tester_role == "mlodziez" and not self.guardian_consent:
            raise ValueError("Osoby niepełnoletnie mogą zgłosić się tylko za zgodą rodzica lub opiekuna prawnego.")
        return self

class FeedbackSubmission(BaseModel):
    campaign_id: str
    tester_name: str = Field(..., min_length=2, max_length=120)
    tester_role: str
    sus_answers: List[int] = Field(..., min_length=10, max_length=10,
                                   description="10 odpowiedzi kwestionariusza SUS w skali 1 (zdecydowanie nie) – 5 (zdecydowanie tak)")
    usability_rating: int = Field(..., ge=1, le=5)
    identified_barriers: str = Field("", max_length=4000)
    improvement_proposals: str = Field("", max_length=4000)

    @field_validator("sus_answers")
    @classmethod
    def _answers(cls, v):
        if any(a < 1 or a > 5 for a in v):
            raise ValueError("Każda odpowiedź SUS musi mieć wartość od 1 do 5.")
        return v

class EvaluationReport(BaseModel):
    campaign_id: str
    total_feedbacks: int
    average_sus_score: Optional[float] = None
    sus_grade: Optional[str] = None
    satisfaction_rate: Optional[float] = None
    common_barriers: List[str]
    readiness_for_scaling: bool
