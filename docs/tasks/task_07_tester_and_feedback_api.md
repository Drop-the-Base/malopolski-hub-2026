# Task 07: Moduł IV – Tester Innowacji (Platforma Testów i Ewaluacji)
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Backend Domain & Quality Evaluation  
> **Waga w wyzwaniu**: +5% punktów bazowych  
> **Szacowany czas realizacji**: 30 minut  
> **Zależności**: Task 02, Task 04  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Udostępnienie modułu pozwalającego na:
1. Przeglądanie aktywnych kampanii testowych prototypów innowacji społecznych w Małopolsce.
2. Rejestrację chętnych testerów (mieszkańcy, seniorzy, osoby z niepełnosprawnościami, opiekunowie, eksperci).
3. Zbieranie ustrukturyzowanej informacji zwrotnej opartej na uznanym standardzie **SUS (System Usability Scale)**, wykrytych barierach i propozycjach usprawnień.
4. Generowanie zbiorczego raportu ewaluacyjnego dla twórcy innowacji i ROPS Kraków.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/models/testing.py`
- `backend/app/schemas/testing_schema.py`
- `backend/app/services/testing_service.py`
- `backend/app/api/v1/testing.py`
- `backend/tests/test_testing.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy API (`testing_schema.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

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
    tester_role: str  # 'senior', 'opiekun', 'osoba_z_niepelnosprawnoscia', 'specjalista'
    motivation: str

class FeedbackSubmission(BaseModel):
    campaign_id: str
    tester_role: str
    sus_score: int = Field(..., ge=0, le=100, description="Wynik w skali System Usability Scale")
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
```

### 3.2. Endpointy w `testing.py`
- `GET /api/v1/testing/campaigns` – Lista otwartych naborów na testerów.
- `POST /api/v1/testing/register` – Rejestracja kandydata na testera.
- `POST /api/v1/testing/feedback` – Zapis ankiety ewaluacyjnej po testach.
- `GET /api/v1/testing/campaigns/{id}/report` – Automatyczny raport zbiorczy metryk SUS.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Endpoint `GET /api/v1/testing/campaigns` zwraca kampanie demonstracyjne (np. dla innowacji `koMIX Życiowy`).
2. Wysłanie ankiety feedbacku poprawnie aktualizuje średni wynik SUS.
3. Test jednostkowy:
   ```bash
   pytest tests/test_testing.py
   ```
