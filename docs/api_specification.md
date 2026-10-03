# Specyfikacja Interfejsów REST API
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Protokół**: REST / JSON
> **Base URL**: `/api/v1` (przez proxy Nginx frontendu: `http://localhost:3000/api/v1`, bezpośrednio: `http://localhost:8000/api/v1`)
> **Dokumentacja interaktywna**: `http://localhost:8000/docs` (Swagger UI generowany z kodu – źródło prawdy dla schematów)
> **Autoryzacja**: endpointy publiczne nie wymagają logowania. Endpointy oznaczone 🔒 wymagają nagłówka `Authorization: Bearer <token>` uzyskanego z `POST /auth/login` (rola koordynatora ROPS).

---

## 1. Zestawienie endpointów

| Moduł | Metoda | Ścieżka | Opis |
|---|---|---|---|
| System | `GET` | `/health` | Stan API, połączenie z bazą, zgodność schematu tabel z modelami, dostępność LLM |
| Uwierzytelnianie | `POST` | `/auth/login` | Logowanie koordynatora ROPS (hasło z `ADMIN_PASSWORD`), zwraca token JWT (HS256) |
| I. Matchmaking | `POST` | `/matchmaking` | Kojarzenie opisu problemu z innowacjami (ranking z progiem trafności) |
| I. Matchmaking | `POST` | `/voice/transcribe` | Transkrypcja nagrania (Groq Whisper) z anonimizacją |
| II. Zasobnik Wiedzy | `GET` | `/knowledge/innovations` | Katalog innowacji; `?search=` ignoruje wielkość liter i polskie znaki, `?category=` |
| II. Zasobnik Wiedzy | `GET` | `/knowledge/innovations/{id}` | Karta innowacji (404 dla nieznanego ID) |
| II. Zasobnik Wiedzy | `POST` 🔒 | `/knowledge/innovations` | Dodanie innowacji (ID nadawane automatycznie: `rops-inn-NNN`) |
| II. Zasobnik Wiedzy | `PUT` 🔒 | `/knowledge/innovations/{id}` | Edycja karty innowacji |
| II. Zasobnik Wiedzy | `DELETE` 🔒 | `/knowledge/innovations/{id}` | Wycofanie z publikacji (soft delete) |
| II. Zasobnik Wiedzy | `GET` | `/knowledge/challenges` | Wyzwania i wskaźniki 22 powiatów |
| II. Zasobnik Wiedzy | `GET` | `/knowledge/materials` | Materiały i narzędzia (`is_external` oznacza link zewnętrzny) |
| III. Kreator Pomysłów | `POST` | `/ideas` | Zgłoszenie fiszki (24/7) – powiadamia ROPS i autora |
| III. Kreator Pomysłów | `GET` 🔒 | `/ideas` | Lista fiszek z danymi kontaktowymi autorów |
| III. Kreator Pomysłów | `GET` | `/ideas/{id}/status` | Publiczny status fiszki (bez danych osobowych) |
| III. Kreator Pomysłów | `PATCH` 🔒 | `/ideas/{id}` | Decyzja koordynatora: status, komentarz do autora, mentor |
| III. Kreator Pomysłów | `POST` | `/canvas/autofill` | Wypełnienie 9 pól Canwy z jednego zdania (Groq LLM, szablon zapasowy) |
| III. Kreator Pomysłów | `POST` | `/canvas/evaluate` | Automatyczna checklista Canwy (reguły, wynik 0–100) |
| III. Kreator Pomysłów | `GET` | `/grant-calls` | Nabory grantowe (demo) z datami i limitami kwot |
| III. Kreator Pomysłów | `POST` | `/grant-applications/generate` | Szkic wniosku – tylko dla otwartego naboru, w limicie kwot |
| IV. Tester | `GET` | `/testing/campaigns` | Kampanie testowe (status `open` lub `full`) |
| IV. Tester | `POST` | `/testing/register` | Zapis na testy (409: brak miejsc / duplikat e-maila) |
| IV. Tester | `POST` | `/testing/feedback` | Ankieta SUS (10 odpowiedzi 1–5), wynik liczony na serwerze |
| IV. Tester | `GET` | `/testing/campaigns/{id}/report` | Zbiorczy raport SUS kampanii |
| V. Komunikacja | `GET` / `POST` | `/communication/threads` | Lista / utworzenie wątku |
| V. Komunikacja | `POST` | `/communication/threads/{id}/messages` | Odpowiedź w wątku (imię i rola wymagane) |
| V. Komunikacja | `GET` | `/communication/mentors` | Mentorzy |
| V. Komunikacja | `GET` | `/communication/mentors/{id}/slots` | Terminy dyżurów (najbliższe 3 tygodnie, 60 min) |
| V. Komunikacja | `POST` | `/communication/mentors/{id}/bookings` | Rezerwacja konsultacji (409: termin zajęty) |
| VI. Panel ROPS | `GET` 🔒 | `/admin/trends` | Radar trendów liczony z danych w bazie |
| VI. Panel ROPS | `GET` 🔒 | `/admin/submissions` | Kolejka fiszek |
| VI. Panel ROPS | `PATCH` 🔒 | `/admin/submissions/{id}/status` | Zgodność wsteczna – deleguje do `PATCH /ideas/{id}` |
| VI. Panel ROPS | `GET` 🔒 | `/admin/notifications` | Powiadomienia panelu (`?channel=panel`) i skrzynka nadawcza e-mail (`?channel=email`) |
| VI. Panel ROPS | `POST` 🔒 | `/admin/notifications/mark-read` | Oznaczenie powiadomień panelu jako przeczytanych |
| VII. Middleman | `POST` | `/middleman/adapt` | Projekt pakietu wdrożeniowego i uchwały dla gminy (404 dla nieznanej innowacji) |
| VII. Middleman | `POST` | `/middleman/chat` | Czat z doradcą wdrożeniowym (LLM, odpowiedź zapasowa bez klucza) |
| Rejestr Wyzwań JST | `GET` | `/problems` | Rejestr wyzwań; anonimowe zapytania Matchmakingu ukryte (`?include_matchmaking=true`) |
| Rejestr Wyzwań JST | `POST` | `/problems` | Zgłoszenie wyzwania; krytyczne → powiadomienie ROPS |
| Rejestr Wyzwań JST | `GET` / `PATCH` | `/problems/{id}` | Szczegóły / aktualizacja statusu i pilności |
| Rejestr Wyzwań JST | `POST` | `/problems/{id}/assign-innovation` | Przypisanie innowacji (422 dla nieznanej) |
| Rejestr Wyzwań JST | `GET` | `/problems/summary/regional?powiat=` | Raport diagnostyczny powiatu z rekomendacjami z dopasowań |
| Narzędzia | `POST` | `/tools/etr-simplify` | Uproszczenie tekstu do formatu ETR |

---

## 2. Zasady wspólne

- **Walidacja**: powiat musi należeć do listy 22 powiatów (`app/core/constants.py`; akceptowane są też formy bez polskich znaków i z przedrostkiem „powiat”), kategorie do słownika 8 kategorii, adresy e-mail są sprawdzane wzorcem, długości pól są ograniczone (np. opis problemu ≤ 4000 znaków).
- **Błędy walidacji (422)** mają czytelną postać:
  ```json
  { "detail": "powiat: Nieznany powiat: 'xyz'. Dozwolone: bocheński, …", "errors": [{ "field": "powiat", "message": "…" }] }
  ```
- **Błędy serwera (500)** nie ujawniają SQL ani parametrów – klient dostaje ogólny komunikat, szczegóły trafiają do logów.
- **Zgody RODO**: `POST /ideas`, `POST /testing/register` i rezerwacja mentora wymagają `rodo_consent: true`.
- **Anonimizacja**: teksty mieszkańców (Matchmaking, Rejestr Wyzwań, autouzupełnianie Canwy, transkrypcja) są przed zapisem i wysłaniem do LLM filtrowane z PESEL, telefonów, e-maili, adresów (`ul.`, `al.`, `os.`, `pl.`), kodów pocztowych oraz typowych imion z nazwiskami.

---

## 3. Kluczowe kontrakty

### 3.1. `POST /matchmaking`
```json
{
  "problem_description": "Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki",
  "powiat": "limanowski",
  "category": null,
  "limit": 4
}
```
Odpowiedź (skrócona):
```json
{
  "clean_query": "…",
  "detected_topics": ["osoby starsze", "bariery w mieszkaniu i higiena"],
  "powiat": "limanowski",
  "no_match": false,
  "matches": [
    {
      "innovation_id": "rops-inn-002",
      "title": "Modularna Łazienka Wytchnieniowa",
      "match_score": 0.83,
      "category": "dostepnosc",
      "category_label": "Dostępność",
      "matched_needs": ["osoby starsze", "bariery w mieszkaniu i higiena"],
      "why_matched": "…uzasadnienie wygenerowane dla tej konkretnej innowacji…",
      "readiness_level": "Wdrożona w 3 gminach",
      "target_groups": ["osoby po udarach", "seniorzy niesamodzielni", "opiekunowie faktyczni"],
      "etr_summary": "…", "video_url": null, "handbook_url": null
    }
  ],
  "similar_cases_count": 3,
  "trend_alert": null,
  "ceneo_intro": "…", "ceneo_bundle_rationale": "…", "action_steps": ["Krok 1: …", "Krok 2: …", "Krok 3: …"],
  "ai_generated": true
}
```
- Wyniki są posortowane malejąco; poniżej progu trafności (0,35) nie są zwracane. Gdy nic nie pasuje: `no_match: true`, pusta lista `matches` i kroki „zgłoś problem / zaproponuj pomysł”.
- `trend_alert` pojawia się tylko, gdy w powiecie w ostatnich 90 dniach zarejestrowano ≥ 2 zgłoszenia w tej samej kategorii (z porównaniem do poprzedniego kwartału, jeśli są dane).
- `ai_generated` = uzasadnienia wygenerował LLM; w przeciwnym razie szablon oparty na `matched_needs`.

### 3.2. `POST /ideas` → `PATCH /ideas/{id}` → `GET /ideas/{id}/status`
```json
{
  "title": "Kawiarenka naprawcza",
  "summary": "Seniorzy uczą młodzież naprawiać sprzęt.",
  "target_audience": "seniorzy i młodzież",
  "implementation_stage": "pomysl",
  "author_name": "Anna Przykładowa",
  "author_email": "anna@example.org",
  "author_type": "mieszkaniec",
  "powiat": "miechowski",
  "rodo_consent": true
}
```
- `implementation_stage`: `pomysl` | `prototyp` | `pilotaz` | `wdrozenie`; `author_type`: `mieszkaniec` | `ngo` | `grupa_nieformalna` | `jst` | `ekspert`.
- Odpowiedź to publiczny status (bez e-maila): `{ "id": "fiszka-1a2b3c4d", "status": "submitted", "status_label": "Złożona", … }`.
- Efekty uboczne: powiadomienie w panelu ROPS + e-mail potwierdzający do autora z linkiem `/status/{id}`.
- `PATCH /ideas/{id}` 🔒: `{ "status": "approved", "admin_notes": "…", "assigned_mentor_id": "mentor-003" }` – statusy: `submitted`, `in_review`, `needs_changes`, `approved`, `rejected`. Autor dostaje e-mail z decyzją, komentarzem i danymi mentora.

### 3.3. `POST /middleman/adapt`
```json
{
  "innovation_id": "rops-inn-010",
  "municipality_name": "Gmina Słaboszów",
  "powiat": "miechowski",
  "population": 3800,
  "senior_percentage": 24,
  "annual_budget_pln": 80000,
  "has_cus": false
}
```
- Limity: `population` 100–1 000 000, `senior_percentage` 0–100, `annual_budget_pln` ≥ 0.
- Przedrostek „Gmina” jest usuwany z nazwy; uchwała używa form „RADY GMINY SŁABOSZÓW”, „Kierownikowi Gminnego Ośrodka Pomocy Społecznej” / „Dyrektorowi Centrum Usług Społecznych”, liczby w formacie polskim („3 800”).
- `blueprint.estimated_budget` zawiera koszt uruchomienia, miesięczny i roczny koszt utrzymania oraz koszt na odbiorcę; `blueprint.disclaimer` przypomina o weryfikacji prawnej (publikatory Dz. U. są pozostawione do uzupełnienia).
- Jeśli koszt pierwszego roku przekracza `annual_budget_pln`, pierwsze ryzyko na liście to przekroczenie budżetu.

### 3.4. `POST /testing/feedback`
```json
{
  "campaign_id": "test-camp-001",
  "tester_name": "Ola",
  "tester_role": "senior",
  "sus_answers": [4, 2, 5, 1, 4, 2, 5, 1, 4, 2],
  "usability_rating": 4,
  "identified_barriers": "",
  "improvement_proposals": ""
}
```
Wynik SUS liczony standardowo (Brooke 1996): pytania nieparzyste `x−1`, parzyste `5−x`, suma × 2,5. Odpowiedź zawiera `sus_score` i `sus_grade`.

### 3.5. `POST /grant-applications/generate`
```json
{ "call_id": "nabor-2026-inkubator", "idea_title": "…", "summary": "…", "target_group": "…",
  "powiat": "miechowski", "gmina": "Miechów", "requested_budget_pln": 30000, "canvas_data": { "problem": "…" } }
```
- 404 – nieznany nabór, 409 – nabór zamknięty, 422 – kwota poza limitem naboru.
- Odpowiedź zawiera `completeness_pct` i `missing_elements`; brakujące pola Canwy są oznaczone w treści jako `[DO UZUPEŁNIENIA: …]` zamiast zmyślonej treści.
