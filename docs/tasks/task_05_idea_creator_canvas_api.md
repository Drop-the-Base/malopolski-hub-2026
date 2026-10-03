# Task 05: Moduł III – Kreator Pomysłów, Canwa Innowacji i Asystent AI
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Backend AI & Business Logic  
> **Waga w wyzwaniu**: +5% punktów bazowych  
> **Szacowany czas realizacji**: 40 minut  
> **Zależności**: Task 02, Task 04  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Stworzenie kompleksowego modułu wspierającego powstawanie nowych innowacji społecznych:
1. **Fiszka Pomysłu (dostępna 24/7)**: Ciągłe zbieranie oddolnych koncepcji mieszkańców i organizacji.
2. **Generator Wniosków Grantowych**: Tryb ustrukturyzowanego wniosku na nabory grantowe ROPS (np. Inkubator Włączenia Społecznego).
3. **Cyfrowa Canwa Innowacji Społecznych**: 9-blokowy model innowacji zgodny z metodyką ROPS Kraków.
4. **Asystent Kreatora (AI Co-Pilot)**:
   - Audyt logiczny Canwy (analiza luk w założeniach, ocena punktowa 0-100).
   - Podpowiedzi niestandardowych rozwiązań.
   - Generator promptu wizualizacji prototypu (np. innowacyjnego przedmiotu lub infografiki usługi).

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/models/idea_fiszka.py`
- `backend/app/models/canvas.py`
- `backend/app/schemas/idea_schema.py`
- `backend/app/services/ai_assistant.py`
- `backend/app/api/v1/ideas.py`
- `backend/tests/test_ideas.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy API (`idea_schema.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FiszkaCreate(BaseModel):
    title: str = Field(..., min_length=5)
    summary: str = Field(..., min_length=20)
    target_audience: str
    implementation_stage: str  # 'pomysl', 'prototyp', 'pilot'
    author_name: str
    author_email: str
    author_type: str  # 'indywidualny', 'ngo', 'grupa_nieformalna', 'jst'
    powiat: str

class CanvasSubmission(BaseModel):
    problem: str
    target_group: str
    value_proposition: str
    barriers: str
    resources: str
    partners: str
    testing_plan: str
    metrics: str
    scalability: str

class CanvasAuditResponse(BaseModel):
    overall_score: int  # 0 - 100
    strengths: List[str]
    logic_gaps: List[str]
    coaching_tips: List[str]
    visual_concept_prompt: str  # Gotowy prompt do wizualizatora AI
```

### 3.2. Logika Asystenta AI (`ai_assistant.py`)
- Prompt audytowy dla Canwy Innowacji:
  ```text
  Przeanalizuj poniższy model Canwy Innowacji Społecznej pod kątem metodyki inkubatora ROPS Kraków:
  {canvas_data}
  Oceń spójność logiczną między problemem a wskaźnikami sukcesu.
  Zwróć odpowiedź w formacie JSON z polami: overall_score, strengths, logic_gaps, coaching_tips, visual_concept_prompt.
  ```
- Wbudowany fallback heurystyczny: Jeśli model zewnętrzny jest niedostępny, silnik sprawdza długość i treść pól (np. czy w polu wskaźników padły słowa kluczowe 'liczba', 'wzrost', '%') i generuje ustrukturyzowany feedback regułowy.

### 3.3. Endpointy w `ideas.py`
- `POST /api/v1/ideas` – Zapis nowej fiszki pomysłu do bazy.
- `GET /api/v1/ideas` – Pobranie listy fiszek z filtrem statusu (`submitted`, `approved`).
- `POST /api/v1/canvas/evaluate` – Audyt AI 9 bloków Canwy.
- `POST /api/v1/canvas/visualize` – Zwraca opis wizualny i kompozycję prototypu.
- `POST /api/v1/grant-applications/generate` – Generuje zarys wniosku grantowego na podstawie fiszki i Canwy.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Endpoint `POST /api/v1/ideas` zapisuje fiszkę i zwraca wygenerowane ID (`fiszka-XXXX`).
2. Endpoint `POST /api/v1/canvas/evaluate` przyjmuje 9 pól Canwy i zwraca ocenę punktową oraz tablicę `logic_gaps`.
3. Test jednostkowy:
   ```bash
   pytest tests/test_ideas.py
   ```
