# Architektura Systemu i Integracje AI
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Autor**: Antigravity AI Architecture Team  
> **Wersja**: 1.0.0  
> **Status**: Approved for Multi-Agent Implementation

---

## 1. Diagram Kontekstowy C4 (System Context)

```mermaid
graph TB
    subgraph Uzytkownicy [Aktorzy Systemu]
        Mieszkaniec["Mieszkaniec / Lider NGO"]
        Samorzad["Przedstawiciel JST / CUS"]
        PracownikROPS["Koordynator ROPS Kraków"]
        Mentor["Ekspert / Mentor"]
        Tester["Tester Innowacji"]
    end

    subgraph HubSystem [Małopolski Hub Innowacji Społecznych]
        Frontend["Frontend Web SPA (React + TypeScript + WCAG AA)"]
        BackendAPI["Backend REST API (FastAPI Python)"]
        VectorEngine["Silnik Wektorowy RAG (ChromaDB / FAISS)"]
        RelationalDB["Baza Relacyjna (SQLite / PostgreSQL)"]
        AIEngine["Warstwa AI (LLM / Embeddings)"]
    end

    subgraph Zewnetrzne [Systemy Zewnętrzne i Źródła Danych]
        ROPSData["Baza Innowacji ROPS Kraków / IWS 2.0"]
        GUSData["Dane Demograficzne Powiatów Małopolski (BDL GUS)"]
        ExternalLLM["Dostawca LLM (Google Gemini / OpenAI / Ollama Local)"]
    end

    Mieszkaniec -->|Zgłasza problem, szuka rozwiązań, tworzy fiszkę| Frontend
    Samorzad -->|Szuka innowacji, generuje Service Blueprint w Middlemanie| Frontend
    PracownikROPS -->|Zarządza wiedzą, monitoruje trendy w Małopolsce| Frontend
    Mentor -->|Udziela feedbacku, wspiera innowatorów| Frontend
    Tester -->|Testuje prototypy, wypełnia ankiety SUS| Frontend

    Frontend -->|REST API / SSE (Streaming)| BackendAPI
    BackendAPI -->|Zapytania CRUD| RelationalDB
    BackendAPI -->|Wyszukiwanie podobieństwa wektorowego (Cos/L2)| VectorEngine
    BackendAPI -->|Generowanie treści, mentoring, adaptacja usług| AIEngine
    AIEngine -->|Konektor API| ExternalLLM
    BackendAPI -->|Pobieranie i synchronizacja wiedzy| ROPSData
    BackendAPI -->|Wskaźniki powiatowe| GUSData
```

---

## 2. Architektura Kontenerowa (Container View)

```mermaid
graph LR
    subgraph DockerCompose [Środowisko Docker Compose]
        subgraph WebContainer [Kontener Frontend - Nginx:alpine]
            WebStatic["Zbudowane pliki React SPA<br/>Port wewnętrzny: 80"]
            ReverseProxy["Nginx Reverse Proxy<br/>/api -> backend:8000"]
        end

        subgraph APIContainer [Kontener Backend - Python 3.11-slim]
            Uvicorn["Serwer ASGI Uvicorn"]
            FastAPIApp["Aplikacja FastAPI"]
            HybridMatchmaker["Moduł Matchmakingu RAG"]
            MiddlemanEngine["Silnik Adaptacji Middleman AI"]
            CanvasMentor["Asystent Canwy Innowacji"]
        end

        subgraph DataVolume [Wolumeny Danych]
            AppDB[("Baza Relacyjna<br/>data/mhis.db")]
            VectorStore[("Baza Wektorowa<br/>data/vector_store")]
            Uploads[("Załączniki / Media<br/>data/uploads")]
        end
    end

    UserBrowser(("Przeglądarka Użytkownika")) -->|HTTP Port 80 / 3000| ReverseProxy
    ReverseProxy -->|Statyczne zasoby| WebStatic
    ReverseProxy -->|Ruch API| Uvicorn
    Uvicorn --> FastAPIApp
    FastAPIApp --> AppDB
    FastAPIApp --> VectorStore
    FastAPIApp --> Uploads
```

---

## 3. Warstwowa Architektura Backendu (FastAPI)

Backend został zaprojektowany w oparciu o czysty wzorzec domenowy (Clean / Hexagonal Architecture):

```
backend/
├── app/
│   ├── main.py                    # Punkt wejściowy FastAPI, CORS, middleware, lifespan
│   ├── core/
│   │   ├── config.py              # Ustawienia z pydantic-settings (.env)
│   │   ├── security.py            # JWT tokeny, haszowanie, ochrona PII
│   │   └── database.py            # Połączenie SQLAlchemy / sesje asynchroniczne
│   ├── models/                    # Modele ORM (SQLAlchemy)
│   │   ├── innovation.py          # Baza innowacji ROPS
│   │   ├── problem_report.py      # Zgłoszenia problemów mieszkańców
│   │   ├── idea_fiszka.py         # Fiszki i wnioski grantowe
│   │   ├── canvas.py              # 9 bloków Canwy Innowacji Społecznych
│   │   ├── testing.py             # Testy prototypów i ankiety ewaluacyjne
│   │   ├── communication.py       # Pytania Q&A, mentorzy, partnerstwa
│   │   └── regional_stats.py      # Statystyki 22 powiatów Małopolski
│   ├── schemas/                   # Schematy walidacji Pydantic v2 (DTO)
│   │   ├── innovation_schema.py
│   │   ├── matchmaking_schema.py
│   │   ├── idea_schema.py
│   │   ├── middleman_schema.py
│   │   └── admin_trends_schema.py
│   ├── services/                  # Logika biznesowa i integracje AI
│   │   ├── matchmaking_service.py # Hybrydowe wyszukiwanie wektorowe + BM25
│   │   ├── vector_store.py        # Adapter ChromaDB / FAISS z lokalnym fallbackiem
│   │   ├── ai_assistant.py        # Mentoring pomysłów, generowanie pytań, luki logiczne
│   │   ├── middleman_service.py   # Generator pakietów wdrożeniowych dla JST
│   │   ├── etr_simplifier.py      # Silnik upraszczania tekstu do formatu ETR
│   │   └── trend_analyzer.py      # Klasteryzacja i wykrywanie anomalii potrzeb
│   ├── api/v1/                    # Kontrolery endpointów REST
│   │   ├── matchmaking.py         # [Moduł I]
│   │   ├── knowledge.py           # [Moduł II]
│   │   ├── ideas.py               # [Moduł III]
│   │   ├── testing.py             # [Moduł IV]
│   │   ├── communication.py       # [Moduł V]
│   │   ├── admin.py               # [Moduł VI]
│   │   └── middleman.py           # [Moduł VII]
│   └── seed/                      # Generator realistycznych danych demonstracyjnych ROPS
│       ├── seed_runner.py
│       └── data/
│           ├── innovations_rops.json
│           ├── malopolska_powiaty.json
│           └── sample_problems.json
```

---

## 4. Rurociąg Matchmakingu Społecznego RAG (Moduł I - Obligatoryjny)

```mermaid
sequenceDiagram
    autonumber
    actor Uzytkownik as Mieszkaniec / JST
    participant API as FastAPI Matchmaking Endpoint
    participant PII as Filtr PII & Normalizator
    participant VecStore as Vector Engine (ChromaDB/FAISS)
    participant FullText as Indeks Słów Kluczowych (BM25)
    participant Rerank as Moduł Rerankingu & LLM
    participant DB as Baza Innowacji ROPS

    Uzytkownik->>API: POST /api/v1/matchmaking (opis: "Brak opieki dla seniorów w Lipnicy")
    API->>PII: Anonimizacja i ekstrakcja intencji
    PII-->>API: Czyste zapytanie + kategoria ('seniorzy', 'mobilność')
    
    par Wyszukiwanie Semantyczne & Leksykalne
        API->>VecStore: Dense Query (Embedding 384/768d)
        VecStore-->>API: Top-K innowacji semantycznych (odległość cosinusowa)
        API->>FullText: Sparse Query (słowa kluczowe: 'senior', 'Lipnica', 'opieka')
        FullText-->>API: Top-K innowacji leksykalnych
    end

    API->>Rerank: Fuzja wyników (Reciprocal Rank Fusion - RRF)
    Rerank->>DB: Pobranie pełnych metadanych innowacji
    DB-->>Rerank: Karty innowacji (np. Mobilny Doradca Seniora, Zmysłoteka)
    Rerank->>Rerank: Wygenerowanie uzasadnienia dopasowania w 2 zdaniach
    Rerank-->>API: Ustrukturyzowana lista rekomendacji ze wskaźnikiem trafności (%)
    API-->>Uzytkownik: Zwrócenie wyników do widoku UI (< 300 ms)
```

---

## 5. Silnik Middlemana Innowacji (Moduł VII - Killer Feature)

Silnik Middlemana odpowiada na kluczowe pytanie stawiane przez samorządy: **"Jak zaadaptować sprawdzoną innowację ROPS do realiów mojej gminy?"**.

```mermaid
graph TD
    InnowacjaMeta["Metadane Innowacji ROPS<br/>(np. Mobilny Doradca Seniora, koszt bazowy: 45 000 zł)"] --> PromptEngine
    SpecyfikaGminy["Dane Gminy wpisane przez urzędnika:<br/>- Nazwa: Gmina Słaboszów<br/>- Populacja: 3 800 osób (32% seniorów)<br/>- Budżet roczny na politykę społeczną: 120 000 zł<br/>- Infrastruktura: brak CUS, działa filia GOPS"] --> PromptEngine

    PromptEngine["Kompilator Promptu Adaptacyjnego Middlemana"] --> LLMModel["Model AI (Gemini 1.5 / GPT-4o / Ollama)"]

    LLMModel --> BlueprintJSON["Ustrukturyzowany Service Blueprint (JSON)"]
    
    BlueprintJSON --> Sekcja1["1. Model Operacyjny Usługi (Krok po kroku)"]
    BlueprintJSON --> Sekcja2["2. Zoptymalizowany Budżet Lokalny (wariant minimum i optimum)"]
    BlueprintJSON --> Sekcja3["3. Wymagania Kadrowe (etaty/umowy zlecenia dla opiekunów)"]
    BlueprintJSON --> Sekcja4["4. Wzór Uchwały Rady Gminy / Regulaminu Świadczenia Usługi"]
    BlueprintJSON --> Sekcja5["5. Matryca Ryzyk i Mierniki Sukcesu (KPI wg wytycznych ROPS)"]
```

---

## 6. Architektura Frontendu (React + TypeScript)

```
frontend/
├── src/
│   ├── main.tsx                   # Inicjalizacja React 18 Root
│   ├── App.tsx                    # Routing (React Router v6) & Providers
│   ├── assets/                    # Logo ROPS Kraków, ikony, grafiki
│   ├── components/                # Reużywalne komponenty
│   │   ├── common/                # Button, Input, Modal, Badge, Card, Spinner
│   │   ├── accessibility/         # AccessibilityBar (kontrast, font zoom, ETR mode)
│   │   ├── layout/                # Navbar, Footer, Breadcrumbs, SkipToContent
│   │   ├── canvas/                # Interaktywny grid 9 pól Canwy Innowacji
│   │   ├── map/                   # SVG Interaktywna Mapa Powiatów Małopolski
│   │   └── visualizer/            # Podgląd konceptu innowacji z asystentem
│   ├── views/                     # Widoki modułów
│   │   ├── HomeView.tsx           # Dashboard główny Hubu
│   │   ├── MatchmakingView.tsx    # [Moduł I] Inteligentny kojarzyciel potrzeb
│   │   ├── KnowledgeView.tsx      # [Moduł II] Biblioteka Innowacji & Kondycja Regionu
│   │   ├── IdeaCreatorView.tsx    # [Moduł III] Fiszka, Wniosek grantowy, Canwa
│   │   ├── TesterView.tsx         # [Moduł IV] Tablica testów i ewaluacja SUS
│   │   ├── CommunicationView.tsx  # [Moduł V] Dialog ROPS, mentorzy, partnerstwa
│   │   ├── AdminDashboardView.tsx # [Moduł VI] Panel koordynatora i Radar Trendów
│   │   └── MiddlemanView.tsx      # [Moduł VII] Adaptacja innowacji do usług dla JST
│   ├── hooks/                     # Custom hooki (useAccessibility, useMatchmaker, useAuth)
│   ├── services/                  # Klient HTTP (Axios / Fetch) ze schematami Zod
│   ├── store/                     # Globalny stan (Zustand: dostępność, koszyk innowacji, profil)
│   └── styles/                    # Tailwind CSS, motywy wysokiego kontrastu (WCAG)
```

---

## 7. Strategia Odporności na Awarię i Tryb Offline

1. **AI Graceful Degradation**:
   - Jeśli brak klucza API do Gemini/OpenAI lub brak połączenia z siecią, system **automatycznie przełącza się na lokalny silnik heurystyczno-wektorowy**:
     - Wyszukiwanie semantyczne wykorzystuje lokalne embeddingi `all-MiniLM-L6-v2` lub bazę podobieństwa TF-IDF/BM25.
     - Asystent Middlemana wykorzystuje wbudowany szablon regułowy z dynamiczną parametryzacją budżetu i wzorem uchwały.
   - Aplikacja **nigdy nie rzuca błędu 500** przy niedostępności zewnętrznego serwera LLM.
2. **Persistence i Wolumeny**:
   - Baza SQLite oraz indeksy wektorowe są montowane jako wolumeny Docker (`/data/mhis.db`), zapewniając trwałość danych między restartami kontenerów.
