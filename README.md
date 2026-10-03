# Małopolski Hub Innowacji Społecznych (MHIS)
### Prototyp platformy wymiany wiedzy, matchmakingu i adaptacji innowacji społecznych dla Małopolski (HackYeah 2026)

[![HackYeah 2026](https://img.shields.io/badge/Hackathon-HackYeah_2026-blue.svg)](https://hackyeah.pl)
[![Partner](https://img.shields.io/badge/Partner-ROPS_Kraków-red.svg)](https://rops.krakow.pl)
[![Standard](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-green.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED.svg)](https://www.docker.com/)
[![Tech Stack](https://img.shields.io/badge/Stack-Python_FastAPI_+_React_TS-blueviolet.svg)](#stos-technologiczny)

---

## 🏛️ Kontekst Wyzwania i Misja Projektu

Regionalny Ośrodek Polityki Społecznej w Krakowie (**ROPS Kraków**) od ponad 10 lat pełni rolę wiodącego inkubatora innowacji społecznych w Polsce (programy: *Inkubator Włączenia Społecznego 1.0 i 2.0*, *Inkubator Dostępności*, *Usługa Wrażliwa*). W portfolio ROPS znajduje się niemal 200 przetestowanych rozwiązań.

Województwo Małopolskie stoi dziś przed fundamentalnymi wyzwaniami:
- **Gwałtowne starzenie się społeczeństwa** w powiatach peryferyjnych (gorlicki, dąbrowski, miechowski).
- **Kryzys zdrowia psychicznego** i poczucie samotności wśród młodzieży i seniorów.
- **Asymetria demograficzna**: dynamiczny wzrost liczby ludności w wianuszku krakowskim vs wyludnianie obszarów wiejskich.
- **Bariera wdrożeniowa w samorządach**: gminy chcą pomagać mieszkańcom, ale nie potrafią zaadaptować innowacji do formy oficjalnej usługi publicznej.

**Małopolski Hub Innowacji Społecznych (MHIS)** to prototyp platformy łączącej mieszkańców, organizacje pozarządowe, jednostki samorządu terytorialnego (JST/CUS) i ekspertów ROPS – przygotowany na HackYeah 2026 jako koncepcja dla ROPS Kraków (nie jest oficjalnym serwisem ROPS).

---

## 🌟 Moduły i stan realizacji

Prototyp obejmuje wszystkie 7 modułów z opisu wyzwania oraz Rejestr Wyzwań JST. Stan po poprawkach z raportu QA: [`docs/QA_FIXES.md`](docs/QA_FIXES.md).

| Moduł | Co działa w prototypie |
|---|---|
| **I. Matchmaking społeczny** (obligatoryjny) | Opis tekstem lub głosem (Whisper) → rozpoznanie potrzeb + TF-IDF → posortowane wyniki powyżej progu trafności, uzasadnienie LLM dla każdej innowacji, stan „brak dopasowania” z przekierowaniem do zgłoszenia problemu lub pomysłu. Dane osobowe maskowane przed analizą. |
| **II. Zasobnik wiedzy** | Biblioteka innowacji (10 kart w wersji demo) z wyszukiwaniem bez względu na polskie znaki, karta innowacji pod własnym adresem, wersje ETR, wyzwania 22 powiatów, materiały. |
| **III. Kreator pomysłów** | Fiszka 24/7 (etap realizacji, zgoda RODO) z numerem i stroną statusu, Canwa 9 pól z autouzupełnianiem LLM i automatyczną checklistą, szkic wniosku tylko dla otwartych naborów z wykazem braków, wydruk do PDF. |
| **IV. Tester innowacji** | Kampanie testowe bez overbookingu i duplikatów, zgoda opiekuna dla niepełnoletnich, kwestionariusz SUS (10 pytań) z raportem kampanii. |
| **V. Komunikacja** | Wątki Q&A i giełda partnerstw, oznaczenie nowych wiadomości, rezerwacja konsultacji z mentorem (potwierdzenie e-mail, plik `.ics`). |
| **VI. Panel ROPS** | Logowanie, kolejka fiszek z decyzją i komentarzem do autora, przydział mentora, powiadomienia i skrzynka e-mail, radar trendów z danych platformy, edycja katalogu innowacji. |
| **VII. Middleman dla JST** | Projekt pakietu wdrożeniowego dla gminy: kroki, kosztorys (uruchomienie, miesięcznie, rocznie, na odbiorcę), kadry, ryzyka, projekt uchwały do weryfikacji prawnej + czat z doradcą AI. |
| **Rejestr wyzwań JST** | Zgłoszenia urzędników z automatycznym dopasowaniem innowacji, przypisanie innowacji, raport diagnostyczny powiatu. |
| **Dostępność** | Dwa tryby wysokiego kontrastu, tekst 125%/150%, tryb ETR (domyślnie włączony), odczyt strony, etykiety pól, dostępne okna dialogowe, tytuły stron, deklaracja dostępności. Szczegóły: [`docs/wcag_compliance.md`](docs/wcag_compliance.md). |

Szacunkowy koszt utrzymania: ok. 170–200 zł/m-c za infrastrukturę i API LLM (+ utrzymanie techniczne) – rozbicie w [`docs/infrastructure.md`](docs/infrastructure.md).

---

## 🚀 Szybki Start (Quickstart)

### Uruchomienie całości w środowisku Docker (Zalecane dla Sędziów)

Wymagania: Zainstalowany Docker i Docker Compose.

```bash
# 1. Klonowanie repozytorium
git clone <adres-repozytorium>
cd malopolska

# 2. Skopiowanie pliku konfiguracyjnego
cp .env.example .env

# 3. Uruchomienie kontenerów (automatyczny build i seed danych ROPS)
docker compose up --build
```

Aplikacja jest natychmiast dostępna:
- **Interfejs Użytkownika (Frontend)**: [http://localhost](http://localhost) lub [http://localhost:3000](http://localhost:3000)
- **Dokumentacja API (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Stan Zdrowia Systemu**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Klucz LLM (opcjonalnie)**: ustaw `GROQ_API_KEY` w `.env` – bez niego aplikacja działa w trybie szablonów.
- **Panel ROPS** (`/admin`): wymaga logowania – hasło demo `rops-demo-2026` (zmienna `ADMIN_PASSWORD`; zmień przed publicznym udostępnieniem).
- **Status zgłoszonej fiszki**: `/status/<numer-fiszki>` (link otrzymuje autor w e-mailu potwierdzającym).
- **Powiadomienia e-mail**: bez `SMTP_HOST` trafiają do skrzynki nadawczej widocznej w Panelu ROPS.
- **Czysta baza demo**: `docker compose down -v && docker compose up --build` (usuwa wolumen `mhis_data` i wgrywa dane od nowa).

---

## 🏗️ Architektura i struktura repozytorium

Szczegóły: [`docs/architecture.md`](docs/architecture.md), API: [`docs/api_specification.md`](docs/api_specification.md), dane: [`docs/data_models.md`](docs/data_models.md).

```
małopolska/
├── backend/                  # Python 3.11 + FastAPI + SQLAlchemy 2.0 (async, SQLite)
│   ├── app/
│   │   ├── api/v1/           # endpointy modułów I–VII, auth, rejestr wyzwań
│   │   ├── core/             # konfiguracja, baza, słowniki (powiaty, kategorie), JWT
│   │   ├── models/           # modele ORM (w tym powiadomienia, zapisy testerów, rezerwacje)
│   │   ├── schemas/          # walidacja Pydantic v2
│   │   ├── services/         # matchmaking, filtr PII, Groq, powiadomienia, Middleman, SUS, trendy
│   │   └── seed/             # dane demo (10 innowacji, 22 powiaty) i korekta istniejących baz
│   └── tests/                # pytest (18 testów, w tym regresja raportu QA)
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind, serwowany przez Nginx
│   └── src/
│       ├── views/            # ekrany modułów, status fiszki, deklaracja dostępności, 404
│       ├── components/       # pasek dostępności, nawigacja, pasek Jury, kafelki powiatów
│       ├── constants/        # słowniki domenowe
│       ├── hooks/            # useDialog – dostępne okna dialogowe
│       ├── store/            # ustawienia dostępności
│       └── services/         # klient API z tokenem koordynatora
├── docs/                     # dokumentacja, raport QA i status poprawek, zadania
├── scripts/smoke_test.py     # test dymny działającego stosu
├── docker-compose.yml
└── .env.example
```

Testy backendu:
```bash
cd backend
DATABASE_URL=sqlite+aiosqlite:///./test.db python -m pytest -q
```

---

## 📋 Katalog Zadań dla Agentów Programistycznych (`docs/tasks/`)

Każde zadanie zostało przygotowane w standardzie *Ready-to-Code* ze szczegółowymi kontraktami, ścieżkami plików i testami:

1. [`task_01_project_scaffolding.md`](docs/tasks/task_01_project_scaffolding.md): Inicjalizacja repozytorium i struktury katalogów.
2. [`task_02_backend_core_db.md`](docs/tasks/task_02_backend_core_db.md): FastAPI core, asynchroniczna baza danych SQLite i endpoint `/health`.
3. [`task_03_rag_matchmaking_service.md`](docs/tasks/task_03_rag_matchmaking_service.md): **[Moduł I]** Hybrydowy Matchmaking RAG, filtr PII, scoring trafności.
4. [`task_04_knowledge_repository_api.md`](docs/tasks/task_04_knowledge_repository_api.md): **[Moduł II]** Baza innowacji ROPS, 22 powiaty Małopolski, materiały edukacyjne.
5. [`task_05_idea_creator_canvas_api.md`](docs/tasks/task_05_idea_creator_canvas_api.md): **[Moduł III]** Fiszka pomysłu 24/7, Canwa Innowacji z audytem AI, generator wniosków grantowych.
6. [`task_06_middleman_adaptation_engine.md`](docs/tasks/task_06_middleman_adaptation_engine.md): **[Moduł VII]** Asystent Middleman (Service Blueprint i uchwała dla gminy) + silnik ETR.
7. [`task_07_tester_and_feedback_api.md`](docs/tasks/task_07_tester_and_feedback_api.md): **[Moduł IV]** Rejestracja testerów, kampanie pilotażowe i ankiety ewaluacji SUS.
8. [`task_08_communication_mentor_api.md`](docs/tasks/task_08_communication_mentor_api.md): **[Moduł V]** Wątki dialogu z ROPS, giełda partnerstw międzysektorowych i baza mentorów.
9. [`task_09_admin_trends_panel_api.md`](docs/tasks/task_09_admin_trends_panel_api.md): **[Moduł VI]** Panel koordynatora ROPS, kolejka moderacji fiszek i Radar Trendów Powiatowych.
10. [`task_10_frontend_setup_and_wcag_shell.md`](docs/tasks/task_10_frontend_setup_and_wcag_shell.md): Szkielet React 18 TS + Tailwind, Pasek Dostępności WCAG 2.1 AA (kontrast, zoom, ETR).
11. [`task_11_frontend_matchmaking_and_explore.md`](docs/tasks/task_11_frontend_matchmaking_and_explore.md): Interfejs kojarzenia potrzeb, karty wyników i interaktywna mapa SVG Małopolski.
12. [`task_12_frontend_idea_wizard_and_middleman.md`](docs/tasks/task_12_frontend_idea_wizard_and_middleman.md): Interaktywna Canwa Innowacji 3x3 oraz generator wdrożenia dla samorządów (Middleman).
13. [`task_13_frontend_admin_and_analytics.md`](docs/tasks/task_13_frontend_admin_and_analytics.md): Pulpit analityczny z wykresami Recharts, widok testów i panel komunikacji.
14. [`task_14_docker_and_demo_seed.md`](docs/tasks/task_14_docker_and_demo_seed.md): Obrazy kontenerów Docker, auto-seeder danych demonstracyjnych i test dymny.
15. [`task_15_ceneo_style_conversational_matchmaker.md`](docs/tasks/task_15_ceneo_style_conversational_matchmaker.md): Konwersacyjne podsumowanie wyników Matchmakingu.
16. [`task_16_stepped_idea_creator_wizard_and_pdf.md`](docs/tasks/task_16_stepped_idea_creator_wizard_and_pdf.md): 3-krokowy kreator pomysłu i wydruk wniosku.
17. [`task_17_middleman_ai_chat_consultant.md`](docs/tasks/task_17_middleman_ai_chat_consultant.md): Czat z doradcą wdrożeniowym dla JST.
18. [`task_18_problems_registry_and_officer_module.md`](docs/tasks/task_18_problems_registry_and_officer_module.md): Rejestr wyzwań i moduł urzędnika JST.

---

## ♿ Dostępność (WCAG 2.1 AA – cel projektowy)

- **Wysoki kontrast**: żółty na czarnym (19,6:1) i czarny na białym (21:1) w całym interfejsie.
- **Rozmiar tekstu**: 100% / 125% / 150%.
- **Klawiatura i czytniki ekranu**: link do treści, widoczny fokus, etykiety wszystkich pól, okna dialogowe z obsługą Escape i pułapką fokusu, zakładki ARIA, komunikaty `aria-live`, tytuł każdej podstrony.
- **Prosty język (ETR)**: streszczenia ETR innowacji, uproszczone nagłówki i opisy, narzędzie `/api/v1/tools/etr-simplify`.
- **Mowa**: zgłaszanie problemu głosem i odczyt strony.

Prototyp nie przeszedł audytu eksperckiego – znane ograniczenia opisuje [`docs/wcag_compliance.md`](docs/wcag_compliance.md) i strona `/deklaracja-dostepnosci`.

---

## 🔒 Bezpieczeństwo i RODO

- Dane demonstracyjne są fikcyjne (e-maile w domenie `example.org`).
- Teksty mieszkańców są anonimizowane (PESEL, telefony, e-maile, adresy, kody pocztowe, imiona z nazwiskami) przed zapisem i przed wysłaniem do LLM. Filtr jest heurystyczny.
- Formularze z danymi kontaktowymi wymagają zgody RODO; dane autorów widzi tylko zalogowany koordynator.
- Błędy serwera nie ujawniają SQL ani parametrów.
- Przed udostępnieniem publicznym: zmień `SECRET_KEY` i `ADMIN_PASSWORD`, włącz HTTPS (lista w [`docs/infrastructure.md`](docs/infrastructure.md)).

---

## 👥 Zespół Projektowy

Opracowano z pasją dla mieszkańców Małopolski i Regionalnego Ośrodka Polityki Społecznej w Krakowie podczas HackYeah 2026.
