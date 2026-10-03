# Zadanie 18: Rejestr Problemów Społecznych i Rozbudowany Panel Urzędnika JST

## Cel Zadania
Znaczące rozbudowanie modułu problemów społecznych z prostego licznika w pełnoprawny **Rejestr Problemów i Wyzwań Regionalnych** dla urzędników gminnych, koordynatorów Centrów Usług Społecznych (CUS) oraz ekspertów ROPS Kraków. Moduł umożliwia profesjonalne rejestrowanie diagnoz, zarządzanie priorytetami, przypisywanie innowacji z bazy wiedzy oraz generowanie raportów diagnostycznych dla organów stanowiących gmin.

---

## Zakres Prac

### 1. Backend (`backend/app/`)
- **Model Bazy Danych** (`models/problem_report.py`):
  - Rozszerzenie tabeli o pola: `title`, `urgency` (standard / urgent / critical), `affected_count`, `reporter_name`, `reporter_role`, `assigned_innovation_id`, `assigned_notes`, `gmina`.
- **Schematy Danych** (`schemas/problem_schema.py`):
  - `ProblemCreate`, `ProblemUpdate`, `ProblemResponse`, `ProblemAssignInnovation`.
- **Router API** (`api/v1/problems.py`):
  - `GET /api/v1/problems`: listowanie problemów z filtrami (powiat, kategoria, status, pilność).
  - `POST /api/v1/problems`: dodanie nowej diagnozy przez urzędnika lub mieszkańca.
  - `PATCH /api/v1/problems/{id}`: zmiana statusu (`nowe`, `w_analizie`, `dopasowano_innowacje`, `pilotaz_jst`, `rozwiazane`) i notatek urzędowych.
  - `POST /api/v1/problems/{id}/assign-innovation`: bezpośrednie powiązanie innowacji ROPS z problemem.

### 2. Frontend (`frontend/src/`)
- **Nowy Widok: Rejestr Problemów** (`views/ProblemsRegistryView.tsx`):
  - **Rejestr Zgłoszeń**: Tabela i karty zgłoszonych wyzwań z filtrami (Powiat, Kategoria, Pilność, Status).
  - **Panel Diagnozy Urzędnika**: Formularz rejestracji wyzwania społecznego dla pracowników CUS/GOPS (kategoria, szacowana liczba mieszkańców, poziom pilności, proponowane partnerstwa).
  - **Przypisywanie Innowacji**: 1 kliknięcie pozwala urzędnikowi wybrać pasującą innowację z katalogu ROPS i przypisać ją do problemu.
  - **Raport Diagnostyczny Gminy (PDF / Druk)**: Zestawienie wyzwań i rekomendacji innowacji przygotowane do przedłożenia Wójtowi / Radzie Gminy.
- **Nawigacja** (`Navbar.tsx` & `App.tsx`):
  - Dodanie trasy `/problemy` i linku **"Rejestr Problemów (JST)"** w głównym menu.

---

## Kryteria Sukcesu
1. Urzędnik może zarejestrować nowy problem społeczny z poziomu dedykowanego formularza.
2. Zgłoszenie natychmiast pojawia się w rejestrze z odpowiednią etykietą pilności i zasila radar analityczny.
3. Urzędnik może przypisać innowację z katalogu ROPS do wybranego problemu.
4. Generowanie raportu diagnostycznego dla gminy działa bez błędów.
