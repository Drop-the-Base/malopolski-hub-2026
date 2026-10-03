# Task 08: Moduł V – Platforma Aktywnej Komunikacji i Baza Mentorów
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Backend Social & Networking API  
> **Waga w wyzwaniu**: +5% punktów bazowych  
> **Szacowany czas realizacji**: 30 minut  
> **Zależności**: Task 02  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Zapewnienie zintegrowanego systemu dialogu międzysektorowego:
1. Bezpośredni kanał pytań i odpowiedzi (Q&A) z ekspertami ROPS Kraków.
2. Baza certyfikowanych mentorów innowacji społecznych z opcją rezerwacji konsultacji online.
3. Tablica poszukiwania partnerstw międzysektorowych (np. NGO szuka gminy lub uczelni z Małopolski do wspólnego wniosku grantowego).

---

## 2. Pliki do Utworzenia / Modyfikacji
- `backend/app/models/communication.py`
- `backend/app/schemas/communication_schema.py`
- `backend/app/services/communication_service.py`
- `backend/app/api/v1/communication.py`
- `backend/tests/test_communication.py`

---

## 3. Szczegóły Implementacji

### 3.1. Schematy API (`communication_schema.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageItem(BaseModel):
    id: str
    sender_name: str
    sender_role: str  # 'mieszkaniec', 'rops_ekspert', 'mentor', 'jst'
    content: str
    created_at: datetime

class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=5)
    category: str  # 'rops_qa', 'poszukiwanie_partnera', 'konsultacja_mentorska'
    author_name: str
    author_role: str
    powiat: str
    initial_message: str

class ThreadDetail(BaseModel):
    id: str
    title: str
    category: str
    author_name: str
    powiat: str
    status: str  # 'open', 'in_progress', 'resolved'
    messages: List[MessageItem]
    created_at: datetime

class MentorProfile(BaseModel):
    id: str
    full_name: str
    specialization: str  # 'Gerontologia i usługi senioralne', 'Dostępność architektoniczna', 'Prawne aspekty CUS'
    bio: str
    available_hours: str
    contact_email: str
```

### 3.2. Endpointy w `communication.py`
- `GET /api/v1/communication/threads` – Lista wątków dyskusyjnych z filtrem kategorii.
- `POST /api/v1/communication/threads` – Otwarcie nowego wątku Q&A lub poszukiwania partnera.
- `POST /api/v1/communication/threads/{id}/messages` – Dodanie odpowiedzi w wątku.
- `GET /api/v1/communication/mentors` – Lista ekspertów i mentorów regionalnych ROPS Kraków.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Pobranie listy mentorów zwraca profile eksperckie z przypisanymi specjalizacjami.
2. Utworzenie wątku i dodanie odpowiedzi poprawnie powiększa listę wiadomości.
3. Test jednostkowy:
   ```bash
   pytest tests/test_communication.py
   ```
