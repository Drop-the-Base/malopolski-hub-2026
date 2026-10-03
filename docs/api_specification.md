# Specyfikacja Interfejsów REST API (OpenAPI Contract)
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Protokół**: RESTful HTTP / JSON / SSE (Server-Sent Events)  
> **Base URL**: `/api/v1`  
> **Autoryzacja**: Bearer JWT (opcjonalna dla modułów publicznych, wymagana dla ról `admin`, `mentor`, `jst`)

---

## 1. Zestawienie Wszystkich Endpointów

| Moduł | Metoda | Ścieżka | Opis |
|---|---|---|---|
| **System** | `GET` | `/health` | Test żywotności serwera, bazy i silnika wektorowego |
| **I. Matchmaking** | `POST` | `/matchmaking` | Hybrydowe kojarzenie problemu z innowacjami (RAG) |
| **II. Zasobnik Wiedzy** | `GET` | `/knowledge/innovations` | Katalog sprawdzonych innowacji ROPS |
| **II. Zasobnik Wiedzy** | `GET` | `/knowledge/innovations/{id}` | Karta pojedynczej innowacji (wideo, PDF, wskaźniki) |
| **II. Zasobnik Wiedzy** | `GET` | `/knowledge/challenges` | Mapa Wyzwań Społecznych 22 powiatów Małopolski |
| **II. Zasobnik Wiedzy** | `GET` | `/knowledge/materials` | Materiały edukacyjne i szablony dobrych praktyk |
| **III. Kreator Pomysłów**| `POST` | `/ideas` | Zgłoszenie nowej fiszki pomysłu (24/7) |
| **III. Kreator Pomysłów**| `GET` | `/ideas` | Lista zgłoszonych fiszek (publiczne/zweryfikowane) |
| **III. Kreator Pomysłów**| `POST` | `/canvas/evaluate` | Asystent AI: audyt logiczny 9 pól Canwy Innowacji |
| **III. Kreator Pomysłów**| `POST` | `/canvas/visualize` | Generowanie promptu wizualizacji koncepcyjnej |
| **III. Kreator Pomysłów**| `POST` | `/grant-applications/generate` | Generator wniosku grantowego dopasowanego do naboru |
| **IV. Tester Innowacji** | `GET` | `/testing/campaigns` | Lista innowacji w fazie otwartych testów |
| **IV. Tester Innowacji** | `POST` | `/testing/register` | Zgłoszenie chęci udziału w testach prototypu |
| **IV. Tester Innowacji** | `POST` | `/testing/feedback` | Wysłanie oceny użyteczności (SUS) i uwag z testu |
| **V. Komunikacja** | `GET` | `/communication/threads` | Wątki dialogu obywatel-ROPS i poszukiwania partnerstw |
| **V. Komunikacja** | `POST` | `/communication/threads` | Utworzenie nowego wątku Q&A / partnerstwa |
| **V. Komunikacja** | `GET` | `/communication/mentors` | Lista dostępnych mentorów regionalnych ROPS |
| **VI. Panel Admina** | `GET` | `/admin/trends` | Radar trendów i agregacja potrzeb per powiat |
| **VI. Panel Admina** | `GET` | `/admin/submissions` | Kolejka zgłoszeń do moderacji przez pracownika ROPS |
| **VI. Panel Admina** | `PATCH` | `/admin/submissions/{id}/status`| Akceptacja/odrzucenie fiszki z komentarzem |
| **VII. Middleman AI** | `POST` | `/middleman/adapt` | Adaptacja innowacji do usługi dla konkretnej gminy JST |
| **Narzędzie ETR** | `POST` | `/tools/etr-simplify` | Zamiana tekstu urzędowego na tekst łatwy do czytania (ETR) |

---

## 2. Kluczowe Kontrakty Żądań i Odpowiedzi

### 2.1. Moduł I: Matchmaking Społeczny
- **Endpoint**: `POST /api/v1/matchmaking`
- **Request Body**:
```json
{
  "problem_description": "W naszej wsi w powiecie gorlickim osoby starsze nie wychodzą z domów, brakuje transportu do przychodni, a sąsiedzi rzadko ich odwiedzają.",
  "powiat": "gorlicki",
  "category": "seniorzy",
  "limit": 3
}
```
- **Response Body (200 OK)**:
```json
{
  "query_analyzed": {
    "topics": ["samotność", "wykluczenie transportowe", "seniorzy"],
    "powiat": "gorlicki"
  },
  "matches": [
    {
      "innovation_id": "rops-inn-001",
      "title": "Mobilny Doradca Seniora",
      "tagline": "Specjalistyczny bus docierający do odległych wsi z poradnictwem i wsparciem sąsiedzkim",
      "match_score": 0.94,
      "why_matched": "Innowacja bezpośrednio rozwiązuje problem braku mobilności u osób starszych na terenach wiejskich poprzez mobilne punkty wsparcia.",
      "readiness_level": "Gotowe do wdrożenia (skalowanie)",
      "target_group": ["seniorzy", "osoby z niepełnosprawnościami"]
    },
    {
      "innovation_id": "rops-inn-004",
      "title": "Sąsiedzki Wolontariat Opiekuńczy (Telefon Życzliwości)",
      "match_score": 0.86,
      "why_matched": "Organizuje lokalną sieć sąsiedzkiego wsparcia i przeciwdziała izolacji społecznej w małych społecznościach.",
      "readiness_level": "Wdrożone w 4 gminach",
      "target_group": ["seniorzy"]
    }
  ],
  "similar_problems_count": 14,
  "trend_alert": "W powiecie gorlickim odnotowano wzrost zgłoszeń w kategorii 'seniorzy - transport' o 28% w ostatnim kwartale."
}
```

---

### 2.2. Moduł VII: Middleman Innowacji (Adaptacja do Usługi JST)
- **Endpoint**: `POST /api/v1/middleman/adapt`
- **Request Body**:
```json
{
  "innovation_id": "rops-inn-001",
  "municipality_name": "Gmina Słaboszów",
  "powiat": "miechowski",
  "population": 3800,
  "senior_percentage": 29.5,
  "annual_budget_pln": 120000,
  "has_cus": false
}
```
- **Response Body (200 OK)**:
```json
{
  "service_blueprint": {
    "title": "Pakiet Wdrożeniowy: Mobilny Doradca Seniora dla Gminy Słaboszów",
    "summary": "Dostosowanie innowacji ROPS do gminy wiejskiej z rozproszoną zabudową i wysokim odsetkiem seniorów.",
    "operational_steps": [
      "Krok 1: Podpisanie porozumienia o transferze know-how z ROPS Kraków.",
      "Krok 2: Adaptacja pojazdu komunalnego lub współpraca z OSP w dni powszednie.",
      "Krok 3: Rekrutacja 1 koordynatora ds. wsparcia seniorów na 1/2 etatu w GOPS.",
      "Krok 4: Uruchomienie cotygodniowych tras objazdowych w 8 sołectwach."
    ],
    "estimated_budget": {
      "initial_setup_pln": 35000,
      "monthly_operating_cost_pln": 6500,
      "suggested_funding_source": "Program Fundusze Europejskie dla Małopolski 2021-2027 (Działanie Włączenie Społeczne) oraz środki własne gminy."
    },
    "staffing_requirements": "1 koordynator (0.5 etatu) + sieć 10 wolontariuszy sołeckich",
    "resolution_draft": "UCHWAŁA NR .../2026 RADY GMINY SŁABOSZÓW w sprawie przyjęcia Programu Wsparcia Seniorów 'Mobilny Doradca'...",
    "risk_mitigation": [
      {
        "risk": "Niski poziom zaufania seniorów do nowej usługi",
        "action": "Zaangażowanie sołtysów i proboszczów do akcji informacyjnej podczas ogłoszeń parafialnych."
      }
    ]
  }
}
```

---

### 2.3. Moduł III: Cyfrowa Canwa Innowacji – Audyt AI
- **Endpoint**: `POST /api/v1/canvas/evaluate`
- **Request Body**:
```json
{
  "canvas_data": {
    "problem": "Brak integracji młodzieży z seniorami w osiedlu.",
    "target_group": "Seniorzy 65+ i młodzież licealna",
    "value_proposition": "Warsztaty cyfrowo-kulinarne w bibliotece",
    "barriers": "Młodzież nie chce spędzać czasu ze starszymi",
    "resources": "Sala w bibliotece gminnej",
    "partners": "Lokalne liceum, biblioteka",
    "testing_plan": "1 warsztat próbny w grudniu",
    "metrics": "Liczba uczestników",
    "scalability": "Rozszerzenie na inne osiedla"
  }
}
```
- **Response Body (200 OK)**:
```json
{
  "overall_score": 82,
  "logic_gaps": [
    "Wskaźnik sukcesu 'Liczba uczestników' mierzy frekwencję, ale nie mierzy zmiany relacji międzypokoleniowej. Sugerujemy dodanie wskaźnika poziomu zaufania lub liczby nawiązanych kontaktów po 3 miesiącach."
  ],
  "strengths": [
    "Świetne wykorzystanie istniejących zasobów biblioteki i szkoły bez konieczności ponoszenia wysokich kosztów lokalowych."
  ],
  "mentor_recommendation": "Warto skonsultować pomysł z innowacją 'koMIX życiowy' w celu wykorzystania komiksów jako metody przełamywania lodów."
}
```
