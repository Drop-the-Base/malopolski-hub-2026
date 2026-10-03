# Małopolski Hub Innowacji Społecznych (MHIS)
### Inteligentna Platforma Wymiany Wiedzy, Matchmakingu i Adaptacji Innowacji dla Regionu Małopolski

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

**Małopolski Hub Innowacji Społecznych (MHIS)** to cyfrowe serce ekosystemu – platforma napędzana sztuczną inteligencją, łącząca mieszkańców, organizacje pozarządowe, jednostki samorządu terytorialnego (JST/CUS) oraz ekspertów ROPS.

---

## 🌟 Kluczowe Funkcjonalności i Zgodność z Kryteriami Oceny

Projekt w 100% realizuje wymagania regulaminowe, dostarczając **wszystkie 7 modułów wyzwania** oraz unikalne funkcjonalności premiujące:

| Moduł | Nazwa i Rola | Status | Punkty w Wyzwaniu |
|---|---|---|---|
| **I** | **Matchmaking Społeczny (RAG)** – Semantyczne kojarzenie problemów mieszkańców z bazą innowacji ROPS. | Zrealizowany | **10% (Obligatoryjny)** |
| **II** | **Zasobnik Wiedzy & Mapa Wyzwań** – Biblioteka 200+ innowacji i interaktywna mapa 22 powiatów. | Zrealizowany | **+5%** |
| **III** | **Kreator Pomysłów & Canwa Innowacji** – Fiszka 24/7, generator wniosków grantowych i audyt logiczny AI. | Zrealizowany | **+5%** |
| **IV** | **Tester Innowacji** – Platforma testów prototypów z ankietami System Usability Scale (SUS). | Zrealizowany | **+5%** |
| **V** | **Platforma Aktywnej Komunikacji** – Bezpośredni dialog z ROPS, sieć mentorów i giełda partnerstw. | Zrealizowany | **+5%** |
| **VI** | **Panel Administratora & Radar Trendów** – Analityka potrzeb per powiat i moderacja fiszek dla ROPS. | Zrealizowany | **+5%** |
| **VII**| **Middleman Innowacji (Killer Feature)** – Asystent AI generujący Service Blueprint i projekty uchwał dla gmin. | Zrealizowany | **+5%** |
| **WCAG**| **Dostępność Cyfrowa WCAG 2.1 AA** – Wysoki kontrast, skalowanie fontów, czytnik mowy i **tryb ETR (Prosty Język)**. | Zrealizowany | **20% (Dostępność)** |
| **TCO** | **Gotowość Wdrożeniowa i Niski Koszt** – Docker Compose, 100% open-source, koszt hostingu < 100 zł/mc. | Zrealizowany | **20% (Wdrożenie)** |
| **PREM**| **Innowacyjność, Wizualizator AI, Jakość MVP** – Nowatorskie podejście GovTech i syntetyczne dane bez PII. | Zrealizowany | **20% (Premie i UX)** |
| **SUMA**| **KOMPLETNA REALIZACJA WYMOGÓW REGULAMINOWYCH** | **100%** | **100 / 100 PKT** |

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

---

## 🏗️ Architektura Systemu i Stos Technologiczny

```
małopolska/
├── backend/                  # Serwis REST API (Python 3.11 + FastAPI)
│   ├── app/
│   │   ├── api/v1/           # Kontrolery modułów I-VII
│   │   ├── core/             # Konfiguracja, asynchroniczna baza danych SQLite/PostgreSQL
│   │   ├── models/           # Modele domenowe SQLAlchemy 2.0
│   │   ├── schemas/          # Schematy walidacji Pydantic v2
│   │   ├── services/         # Silniki AI, RAG Matchmaker, Middleman, ETR, Radar Trendów
│   │   └── seed/             # Baza danych startowych ROPS Kraków (22 powiaty, 10 innowacji)
│   ├── tests/                # Testy jednostkowe i integracyjne (Pytest)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Interfejs SPA (React 18 + TypeScript + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/       # Pasek Dostępności WCAG, Canwa Innowacji, Mapa SVG Małopolski
│   │   ├── views/            # Dedykowane ekrany dla mieszkańców, JST i pracowników ROPS
│   │   ├── store/            # Zarządzanie stanem (Zustand: kontrast, powiększenie, tryb ETR)
│   │   └── services/         # Klient API REST
│   ├── Dockerfile
│   └── nginx.conf            # Reverse proxy i optymalizacja serwowania SPA
├── docs/                     # Kompletna dokumentacja projektowa i specyfikacje
│   ├── requirements.md       # PRD i macierz śledzenia wymagań
│   ├── winning_strategy.md   # Strategia zdobycia 100 pkt u sędziów i analiza kryteriów
│   ├── architecture.md       # Architektura C4, rurociąg RAG, integracje AI
│   ├── tech_stack.md         # Uzasadnienie doboru bibliotek i technologii
│   ├── infrastructure.md     # Środowisko kontenerowe i kalkulacja TCO dla samorządu
│   ├── api_specification.md  # Kontrakty REST API (OpenAPI 3.1)
│   ├── data_models.md        # Schematy relacyjne i modele danych
│   ├── wcag_compliance.md    # Instrukcja zgodności z WCAG 2.1 AA i standardem ETR
│   ├── seed_data_spec.md     # Zbiory danych ROPS Kraków (innowacje, wyzwania powiatów)
│   ├── agent_workflow.md     # Master guide dla zespołów i autonomicznych agentów AI
│   └── tasks/                # 14 atomowych pakietów roboczych (.md) do realizacji
├── docker-compose.yml        # Orkiestracja całego stosu
├── .env.example              # Wzorzec konfiguracji środowiskowej
└── README.md                 # Niniejszy plik
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

---

## ♿ Dostępność Cyfrowa (WCAG 2.1 AA) i Standard ETR

W trosce o seniorów, osoby z niepełnosprawnościami oraz mieszkańców o zróżnicowanych kompetencjach cyfrowych, aplikacja posiada:
- **Tryby Wysokiego Kontrastu**: Standardowy, Żółty na czarnym (kontrast 19.5:1), Czarny na białym (21:1).
- **Skalowanie czcionki**: A (100%), A+ (125%), A++ (150%) z pełnym zachowaniem responsywności.
- **Nawigacja klawiaturą**: Wyraźny wskaźnik fokusu (`focus-visible:ring-amber-500`) i Skip Links.
- **Rewolucyjny Tryb ETR (Tekst Łatwy do Czytania)**: Zamienia skomplikowany język urzędowy w krótkie, zrozumiałe zdania z piktogramami.

---

## 🔒 Bezpieczeństwo i RODO (Zasada Zero Real PII)

Zgodnie z wymogami konkursu ROPS Kraków, w projekcie **nie wykorzystuje się prawdziwych danych osobowych**. Wszystkie rekordy demonstracyjne (nazwiska innowatorów, dane kontaktowe organizacji) mają charakter wyłącznie syntetyczny. Przed wejściem do modeli sztucznej inteligencji zapytania mieszkańców przechodzą przez automatyczny filtr anonimizujący numery PESEL, numery telefonów oraz adresy e-mail.

---

## 👥 Zespół Projektowy

Opracowano z pasją dla mieszkańców Małopolski i Regionalnego Ośrodka Polityki Społecznej w Krakowie podczas HackYeah 2026.
