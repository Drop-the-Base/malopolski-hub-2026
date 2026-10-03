# Task 06: Moduł VII – Middleman Innowacji (Asystent Adaptacji do Usługi JST)
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: AI Service Engineering & GovTech Innovation  
> **Waga w wyzwaniu**: +5% punktów bazowych + **Kluczowy element Potencjału Wdrożeniowego (20% oceny sędziów)**  
> **Szacowany czas realizacji**: 45 minut  
> **Zależności**: Task 02, Task 04  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Zbudowanie dedykowanego Asystenta AI dla Jednostek Samorządu Terytorialnego (gminy, CUS, GOPS/MOPS). Narzędzie to przekształca wybraną innowację społeczną ROPS Kraków w gotowy **Pakiet Wdrożeniowy Usługi Publicznej (Service Blueprint)**, spersonalizowany pod profil demograficzno-finansowy konkretnej gminy z Małopolski.

Moduł ten dodatkowo udostępnia silnik upraszczania języka urzędowego do standardu **ETR (Tekst Łatwy do Czytania)**.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/schemas/middleman_schema.py`
- `backend/app/services/middleman_service.py`
- `backend/app/services/etr_simplifier.py`
- `backend/app/api/v1/middleman.py`
- `backend/tests/test_middleman.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy API (`middleman_schema.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AdaptationRequest(BaseModel):
    innovation_id: str = Field(..., description="ID innowacji z bazy ROPS")
    municipality_name: str = Field(..., description="Nazwa gminy, np. 'Gmina Słaboszów'")
    powiat: str = Field(..., description="Powiat małopolski, np. 'miechowski'")
    population: int = Field(..., ge=500, le=1000000)
    senior_percentage: float = Field(..., ge=5.0, le=60.0)
    annual_budget_pln: int = Field(..., ge=10000)
    has_cus: bool = Field(default=False, description="Czy gmina posiada Centrum Usług Społecznych?")

class RiskItem(BaseModel):
    risk: str
    action: str

class ServiceBlueprint(BaseModel):
    title: str
    summary: str
    operational_steps: List[str]
    estimated_budget: Dict[str, Any]
    staffing_requirements: str
    resolution_draft: str
    risk_mitigation: List[RiskItem]

class AdaptationResponse(BaseModel):
    blueprint: ServiceBlueprint
    generated_at: str

class ETRRequest(BaseModel):
    source_text: str = Field(..., min_length=10)

class ETRResponse(BaseModel):
    simple_text: str
    key_points: List[str]
    reading_ease_score: int
```

### 3.2. Silnik Middlemana (`middleman_service.py`)
- Pobiera metadane innowacji z bazy (lub słownika).
- Wylicza wstępne estymacje budżetowe (np. `budżet bazowy * skala populacji`).
- Formułuje prompt do modelu LLM (Gemini 1.5 Flash / OpenAI):
  ```text
  Jesteś ekspertem prawa samorządowego i polityki społecznej w Małopolsce.
  Dostosuj innowację "{innowacja_nazwa}" dla gminy: {gmina}, powiat: {powiat}.
  Populacja: {populacja} (w tym {senior_pct}% seniorów).
  Roczny budżet na to zadanie: {budzet} zł. Czy ma CUS: {has_cus}.
  Wygeneruj ustrukturyzowany Service Blueprint: kroki operacyjne, podział budżetu, wymagania etatowe, projekt uchwały rady gminy i mitygację ryzyk.
  ```
- **Odporność na brak Internetu / klucza**: Zaimplementować deterministyczny generator szablonów prawno-organizacyjnych, który wstawia nazwę gminy, wylicza koszty i generuje poprawny szablon uchwały samorządowej offline.

### 3.3. Asystent ETR (`etr_simplifier.py`)
- Skraca skomplikowane zdania urzędowe do 8-12 słów, eliminuje żargon, tworzy listy punktowane i przypisuje emotikony ułatwiające zrozumienie.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Wysłanie POST na `/api/v1/middleman/adapt` z danymi gminy zwraca kompletny obiekt `ServiceBlueprint` zawierający pole `resolution_draft` z tekstem uchwały.
2. Wysłanie POST na `/api/v1/tools/etr-simplify` z tekstem urzędowym zwraca uproszczoną wersję ETR.
3. Uruchomienie testu:
   ```bash
   pytest tests/test_middleman.py
   ```
