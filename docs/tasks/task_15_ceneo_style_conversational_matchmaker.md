# Zadanie 15: Konwersacyjny Matchmaker AI w Stylu Ceneo (Diagnoza + Pakiet Komplementarny)

## Cel Zadania
Przekształcenie dotychczasowego modułu Matchmakingu w interaktywnego, empatycznego asystenta doradczego w stylu asystenta zakupowego (np. Ceneo). Użytkownik po opisaniu swojego wyzwania życiowego nie otrzymuje jedynie suchych kart ze wskaźnikami procentowymi, lecz ustrukturyzowaną, profesjonalną diagnozę oraz **spójny, komplementarny pakiet innowacji społecznych** z jasnym wyjaśnieniem wzajemnych zależności i checklistą działań krok po kroku.

---

## Zakres Prac

### 1. Backend (`backend/app/`)
- **Schemat Danych** (`schemas/matchmaking_schema.py`):
  - Dodanie pól `ceneo_intro` (np. *"Jasne 🤝 Zidentyfikowaliśmy wyzwanie..."*), `ceneo_bundle_rationale` (dlaczego te innowacje tworzą zintegrowany pakiet), `action_steps` (rekomendowane 3 kroki od zaraz).
- **Logika Kojarzenia** (`services/matchmaking_service.py`):
  - Generowanie za pośrednictwem Groq AI (`openai/gpt-oss-20b` w ~0.8s) syntetycznego podsumowania w stylu doradcy Ceneo.
  - Wyodrębnienie grup funkcjonalnych pakietu (np. Adaptacja otoczenia + Usługi środowiskowe + Wsparcie wytchnieniowe).
  - Deterministyczny fallback gwarantujący 100% dostępności w trybie offline.

### 2. Frontend (`frontend/src/`)
- **Widok Matchmakingu** (`views/MatchmakingView.tsx`):
  - Wzbogacenie sekcji wynikowej o estetyczny baner asystenta konwersacyjnego:
    - Nagłówek: *"Twój Zintegrowany Pakiet Wsparcia ROPS Kraków"*.
    - Syntetyczna diagnoza wyzwania.
    - Zestawienie innowacji z podziałem na role w pakiecie.
    - Sekcja: *"Dlaczego ten zestaw rozwiązań?"* (wyjaśnienie synergii).
    - Checklista natychmiastowych kroków dla mieszkańca / opiekuna.

---

## Kryteria Sukcesu
1. Matchmaker dla zapytania w języku naturalnym zwraca odpowiedź z empatycznym wstępem, podsumowaniem problemu i wyjaśnieniem synergii pakietu.
2. Czas generowania nie przekracza 1.5 sekundy.
3. Testy jednostkowe `pytest tests/test_matchmaking.py` przechodzą pomyślnie.
