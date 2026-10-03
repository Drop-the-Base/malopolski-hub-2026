# Task 09: Moduł VI – Panel Administratora i Radar Trendów Społecznych ROPS
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Backend Analytics & Admin Moderation  
> **Waga w wyzwaniu**: +5% punktów bazowych  
> **Szacowany czas realizacji**: 35 minut  
> **Zależności**: Task 02, Task 03, Task 05  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Zapewnienie koordynatorom ROPS Kraków narzędzi zarządczych:
1. **Moderacja i Weryfikacja**: Kolejka zgłoszonych fiszek pomysłów z możliwością zatwierdzenia do publicznej bazy, odrzucenia lub odesłania do korekty z uwagami.
2. **Radar Trendów Społecznych (Opcja zastrzeżona dla administratora)**:
   - Agregacja danych ze wszystkich zapytań Matchmakingu i zgłoszonych problemów w Małopolsce.
   - Identyfikacja dynamicznie rosnących wyzwań w ujęciu powiatowym (wykrywanie anomalii i alertów).
   - Generowanie zbiorczych wskaźników dla Zarządu Województwa Małopolskiego.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/schemas/admin_trends_schema.py`
- `backend/app/services/trend_analyzer.py`
- `backend/app/api/v1/admin.py`
- `backend/tests/test_admin.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy API (`admin_trends_schema.py`)
```python
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class PoviatTrendMetric(BaseModel):
    powiat: str
    top_problem_category: str
    reported_cases_count: int
    quarterly_growth_pct: float
    alert_level: str  # 'low', 'medium', 'high_critical'

class TrendRadarSummary(BaseModel):
    total_problems_analyzed: int
    most_acute_challenges: List[Dict[str, Any]]
    poviat_breakdown: List[PoviatTrendMetric]
    systemic_gaps: List[str]  # np. 'Brak innowacji dla seniorów niemobilnych w pow. dąbrowskim'

class SubmissionStatusUpdate(BaseModel):
    new_status: str  # 'approved', 'rejected', 'needs_revision'
    admin_feedback: Optional[str] = None
    assigned_mentor_id: Optional[str] = None
```

### 3.2. Silnik Analityczny (`trend_analyzer.py`)
- Agreguje rekordy z tabeli `problem_reports` oraz `idea_fiszkas`.
- Oblicza dynamikę zmian zapotrzebowania w powiatach.
- Identyfikuje "białe plamy" – powiaty o wysokim wskaźniku starzenia się i braku aktywnych innowacji.

### 3.3. Endpointy w `admin.py`
- `GET /api/v1/admin/trends` – Pełny raport Radaru Trendów (dostępny po autoryzacji admina).
- `GET /api/v1/admin/submissions` – Lista nadesłanych fiszek oczekujących na decyzję.
- `PATCH /api/v1/admin/submissions/{id}/status` – Zmiana statusu fiszki z komentarzem zwrotnym.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Endpoint `GET /api/v1/admin/trends` zwraca zsyntetyzowane trendy per powiat (np. Gorlice, Miechów, Tarnów).
2. Endpoint `PATCH /api/v1/admin/submissions/{id}/status` zmienia status fiszki w bazie danych.
3. Test jednostkowy:
   ```bash
   pytest tests/test_admin.py
   ```
