# Task 03: Moduł I – Matchmaking Społeczny i Silnik Wyszukiwania RAG (Obligatoryjny)
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: AI / RAG & Backend Domain  
> **Waga w wyzwaniu**: **Kluczowa (Funkcjonalność Obligatoryjna – 10% punktów wyzwania)**  
> **Szacowany czas realizacji**: 45 minut  
> **Zależności**: Task 02  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Zbudowanie inteligentnego mechanizmu łączącego zgłaszane przez mieszkańców, NGO i JST problemy społeczne z istniejącymi innowacjami społecznymi ROPS Kraków. System musi:
1. Przyjąć swobodny opis problemu w języku naturalnym.
2. Zanonimizować dane wrażliwe (filtr PII).
3. Wykonać wyszukiwanie hybrydowe (semantyczne wektorowe + słowa kluczowe).
4. Wygenerować 2-zdaniowe uzasadnienie dopasowania dla każdej rekomendacji.
5. Zapisać zapytanie w bazie do celów analitycznych (Radar Trendów).

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/models/problem_report.py`
- `backend/app/schemas/matchmaking_schema.py`
- `backend/app/services/vector_store.py`
- `backend/app/services/matchmaking_service.py`
- `backend/app/api/v1/matchmaking.py`
- `backend/tests/test_matchmaking.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy Wejścia / Wyjścia (`matchmaking_schema.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class MatchmakingRequest(BaseModel):
    problem_description: str = Field(..., min_length=10, description="Swobodny opis problemu społecznego")
    powiat: Optional[str] = Field(None, description="Nazwa powiatu w Małopolsce (np. 'gorlicki')")
    category: Optional[str] = Field(None, description="Kategoria problemu (np. 'seniorzy', 'zdrowie_psychiczne')")
    limit: int = Field(default=3, ge=1, le=10)

class InnovationMatchItem(BaseModel):
    innovation_id: str
    title: str
    tagline: str
    match_score: float
    why_matched: str
    readiness_level: str
    target_group: List[str]
    etr_summary: Optional[str] = None

class MatchmakingResponse(BaseModel):
    clean_query: str
    detected_topics: List[str]
    powiat: Optional[str]
    matches: List[InnovationMatchItem]
    similar_cases_count: int
    trend_alert: Optional[str] = None
```

### 3.2. Silnik Wektorowy z Graceful Fallback (`vector_store.py`)
Implementacja powinna:
- Użyć `chromadb` lub lekkiego kalkulatora `scikit-learn` / cosine similarity z lokalnymi embeddingami `sentence-transformers` (`all-MiniLM-L6-v2`) lub fallbackiem TF-IDF.
- Posiadać precyzyjnie przygotowane wektory dla 10 bazowych innowacji ROPS (zgodnie z `docs/seed_data_spec.md`).

### 3.3. Generator Uzasadnienia Dopasowania (`matchmaking_service.py`)
- Jeśli dostępny jest klucz `GEMINI_API_KEY` / `OPENAI_API_KEY`, wywołuje prompt:
  ```
  Jesteś ekspertem ROPS Kraków ds. innowacji społecznych.
  Użytkownik zgłosił problem: "{problem}"
  Rekomendowana innowacja: "{innovation_title}" - {tagline}
  Wytłumacz w maksymalnie 2 zwięzłych zdaniach po polsku, dlaczego to rozwiązanie odpowiada na ten konkretny problem.
  ```
- W przypadku braku klucza lub awarii sieci, stosuje inteligentny fallback regułowy:
  `"Innowacja '{title}' bezpośrednio odpowiada na zdiagnozowane wyzwanie w obszarze {category}, oferując sprawdzoną metodykę wdrożoną w Małopolsce."`

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Wywołanie POST na `/api/v1/matchmaking` z zapytaniem:
   ```json
   {
     "problem_description": "Osoby starsze w naszej gminie są samotne i nie mają jak dojechać do lekarza.",
     "powiat": "gorlicki"
   }
   ```
2. Wynik musi zwrócić co najmniej 1 trafną innowację (np. `Mobilny Doradca Seniora`) ze wskaźnikiem `match_score` > 0.70 oraz polem `why_matched`.
3. Czas odpowiedzi < 500 ms.
4. Uruchomienie testu:
   ```bash
   pytest tests/test_matchmaking.py
   ```
