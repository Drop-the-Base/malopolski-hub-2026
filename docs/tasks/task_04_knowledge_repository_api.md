# Task 04: Moduł II – Zasobnik Wiedzy i Mapa Wyzwań Małopolski
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Backend Domain & Content Management  
> **Waga w wyzwaniu**: +5% punktów bazowych  
> **Szacowany czas realizacji**: 35 minut  
> **Zależności**: Task 02  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Zaimplementowanie modułu Zasobnika Wiedzy, prezentującego wiedzę i dorobek Regionalnego Ośrodka Polityki Społecznej w Krakowie:
1. **Biblioteka Innowacji Społecznych**: Katalog sprawdzonych innowacji z multimediami (wideo, podręczniki, wskaźniki).
2. **Kondycja Małopolski i Mapa Wyzwań**: Baza danych demograficznych i wyzwań dla wszystkich 22 powiatów regionu.
3. **Materiały Edukacyjne**: Przewodniki, szablony Canwy Innowacji i metodyka inkubacji.
4. Szybka aktualizacja i filtrowanie (kategoria, grupa docelowa, powiat, poziom gotowości).

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/models/innovation.py`
- `backend/app/models/regional_stat.py`
- `backend/app/schemas/innovation_schema.py`
- `backend/app/services/knowledge_service.py`
- `backend/app/api/v1/knowledge.py`
- `backend/tests/test_knowledge.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy API (`innovation_schema.py`)
```python
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
    format: str  # 'PDF', 'DOCX', 'VIDEO'
```

### 3.2. Endpointy w `knowledge.py`
- `GET /api/v1/knowledge/innovations` – Pobieranie listy innowacji z opcjonalnymi parametrami query:
  - `category`: np. `seniorzy`, `zdrowie_psychiczne`
  - `target_group`: np. `młodzież`, `opiekunowie`
  - `search`: wyszukiwanie w tytule i opisie
- `GET /api/v1/knowledge/innovations/{id}` – Pełne szczegóły pojedynczej innowacji z materiałami wideo i wersją ETR.
- `GET /api/v1/knowledge/challenges` – Zwraca listę 22 powiatów z ich wskaźnikami społecznymi (na potrzeby interaktywnej mapy SVG).
- `GET /api/v1/knowledge/materials` – Lista publikacji metodycznych ROPS Kraków.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Zapytanie `GET /api/v1/knowledge/innovations` zwraca status 200 i co najmniej 10 obiektów innowacji.
2. Zapytanie `GET /api/v1/knowledge/challenges` zwraca zestawienie powiatów Małopolski (m.in. gorlicki, wielicki, m. Kraków, tarnowski).
3. Test jednostkowy:
   ```bash
   pytest tests/test_knowledge.py
   ```
