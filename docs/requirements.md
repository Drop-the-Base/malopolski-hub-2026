# Dokument Wymagań Biznesowych i Funkcjonalnych (PRD)
## Małopolski Hub Innowacji Społecznych (MHIS) – ROPS Kraków

> **Instytucja zamawiająca**: Regionalny Ośrodek Polityki Społecznej w Krakowie (ROPS Kraków), Samorząd Województwa Małopolskiego.  
> **Kontekst**: HackYeah 2026 – Zadanie: *Zaprojektuj inteligentne narzędzie wspierające rozwój Małopolskiego Hubu Innowacji Społecznych*.  
> **Wersja**: 1.0.0 (Status: Ready for Implementation)

---

## 1. Wprowadzenie i Cel Projektu

### 1.1. Kontekst Społeczny i Organizacyjny
ROPS Kraków od ponad 10 lat pełni rolę regionalnego inkubatora innowacji społecznych w Polsce (projekty: *Małopolski Inkubator Innowacji Społecznych*, *Inkubator Włączenia Społecznego 1.0 i 2.0*, *Inkubator Dostępności*, *Usługa Wrażliwa*). W portfolio ROPS znajduje się niemal 200 przetestowanych innowacji.

Województwo Małopolskie mierzy się obecnie z kluczowymi wyzwaniami:
1. **Starzenie się społeczeństwa** (zwłaszcza w powiatach gorlickim, tarnowskim, nowosądeckim, dąbrowskim).
2. **Kryzys zdrowia psychicznego** (szczególnie wśród dzieci, młodzieży i młodych dorosłych).
3. **Poczucie samotności i izolacji** (seniorzy oraz osoby z niepełnosprawnościami).
4. **Wykluczenie cyfrowe i komunikacyjne** (utrudniony dostęp do e-usług w gminach wiejskich).
5. **Ograniczony dostęp do specjalistycznych usług społecznych**.
6. **Asymetria demograficzna**: dynamiczny wzrost ludności w gminach wianuszka krakowskiego (Wieliczka, Zielonki, Zabierzów) vs depopulacja i odpływ kadr opiekuńczych na obrzeżach regionu.
7. **Brak skalowalności mikro-rozwiązań**: NGO i Centra Usług Społecznych (CUS) tworzą wartościowe rozwiązania, które pozostają lokalnymi enklawami.

### 1.2. Główny Cel Narzędzia
Stworzenie **cyfrowego serca** Małopolskiego Hubu Innowacji Społecznych – platformy opartej o sztuczną inteligencję, która:
- Automatycznie kojarzy zgłaszane problemy społeczne ze sprawdzonymi innowacjami (Matchmaking Społeczny – RAG).
- Prowadzi użytkownika od diagnozy problemu, przez inkubację (Canwa innowacji), po przygotowanie wniosku grantowego.
- Umożliwia Jednostkom Samorządu Terytorialnego (JST/CUS) adaptację gotowych innowacji do formy lokalnych usług publicznych (Asystent Middleman AI).
- Integruje społeczność innowatorów, testerów, mentorów i pracowników ROPS.
- Spełnia rygorystyczne normy dostępności **WCAG 2.1 AA** (dostępność dla seniorów i osób z niepełnosprawnościami).

---

## 2. Grupy Odbiorców (Persony)

| Persona | Rola | Potrzeby i Bóle | Oczekiwania wobec Systemu |
|---|---|---|---|
| **P1: Mieszkaniec / Działacz NGO** | Innowator oddolny, lider lokalny | Widzi problem (np. samotność sąsiadów, brak podjazdu), nie zna procedur urzędowych, brak wiedzy o grantach. | Super prosty formularz w prostym języku (ETR), wyszukiwarka rozwiązań, asystent AI tworzący zarys innowacji (Canwa). |
| **P2: Przedstawiciel JST / CUS** | Decydent samorządowy, dyrektor CUS / OPS | Musi rozwiązać problem w gminie (np. brak opiekunów osób starszych), ma budżet, ale brak mu gotowych modeli wdrożeniowych. | Katalog innowacji z filtrami (koszt, czas wdrożenia, wskaźniki), Asystent Middleman generujący plan wdrożenia usługi w gminie. |
| **P3: Pracownik ROPS Kraków** | Koordynator, moderator, administrator | Setki zgłoszeń, rozproszone bazy wiedzy, trudność w wyłapywaniu powtarzających się trendów w powiatach. | Panel administracyjny, pulpit analityczny (mapa potrzeb, radar trendów), weryfikacja i moderacja fiszek jednym kliknięciem. |
| **P4: Mentor / Ekspert Branżowy** | Konsultant merytoryczny | Chce sprawnie opiniować pomysły, dawać feedback innowatorom, nie chce tonąć w mailach. | Wygodny moduł komunikacji, powiadomienia, wątki dyskusyjne przypisane do konkretnych fiszek i testów. |
| **P5: Tester Innowacji** | Użytkownik końcowy, senior, ozN | Chce testować nowe przedmioty/usługi i realnie wpływać na ich dopracowanie. | Prosty mechanizm zapisu na testy, intuicyjna ankieta zadowolenia, duży kontrast, syntezator tekstu. |

---

## 3. Szczegółowe Wymagania Funkcjonalne wg Modułów Wyzwania

### Moduł I: Matchmaking Społeczny (OBLIGATORYJNY)
- **FR-1.1**: Wyszukiwarka semantyczna w języku naturalnym. Mieszkaniec wpisuje np.: *"W naszej wsi starsze osoby nie mają jak dojechać do lekarza i czują się odcięte"*.
- **FR-1.2**: Mechanizm Hybrid Search (BM25 + Dense Vector Embeddings):
  - Analiza intencji, słów kluczowych i kontekstu geograficznego.
  - Wyszukiwanie podobnych zgłoszeń w bazie Małopolski (klasteryzacja problemu).
- **FR-1.3**: Rekomendacja sprawdzonych innowacji z bazy ROPS z oceną trafności (% dopasowania), uzasadnieniem AI w 2 zdaniach oraz bezpośrednim linkiem do karty innowacji.
- **FR-1.4**: Opcja *"Nie znalazłem rozwiązania"* – automatyczne przeniesienie opisu do Kreatora Pomysłów z autofillem.

### Moduł II: Zasobnik Wiedzy (Biblioteka & Kondycja Małopolski)
- **FR-2.1**: **Biblioteka Innowacji Społecznych**:
  - Karty innowacji z bogatymi multimediami (wideo, instrukcje, podręczniki dobrych praktyk).
  - Tagi: grupa docelowa (seniorzy, młodzież, ozN, rodziny), powiat/gmina, skala kosztów (niski, średni, wysoki), status (gotowa do skalowania, w fazie testów).
- **FR-2.2**: **Kondycja Małopolski i Mapa Wyzwań Społecznych**:
  - Prezentacja kluczowych danych regionalnych na interaktywnej mapie (podział na 22 powiaty Małopolski).
  - Wskaźniki: wskaźnik starości demograficznej, dostępność placówek wsparcia, zgłoszone zapotrzebowanie oddolne.
- **FR-2.3**: **Materiały Edukacyjne**:
  - Kurs pigułkowy: Czym jest innowacja społeczna? Jak przeprowadzić diagnozę potrzeb?
  - Pobieralne szablony (PDF/DOCX/online).
- **FR-2.4**: Szybka aktualizacja przez panel ROPS (CRUD) z wersjonowaniem treści.

### Moduł III: Kreator Pomysłów & Asystent AI
- **FR-3.1**: **Fiszka Pomysłu (24/7)**:
  - Formularz ciągły: Tytuł, problem, propozycja innowacji, grupa docelowa, etap dojrzałości (pomysł, prototyp, pierwsze testy).
- **FR-3.2**: **Generator Wniosków Grantowych (Tryb Naborów)**:
  - Dynamiczny kreator wniosku dopasowany do bieżących konkursów grantowych ROPS (np. IWS 2.0).
  - Wbudowany moduł walidacji budżetu i harmonogramu.
- **FR-3.3**: **Cyfrowa Canwa Innowacji Społecznych**:
  - Interaktywny model kanwy (9 pól: Problem, Grupa docelowa, Wartość innowacji, Bariery, Zasoby, Partnerzy, Testowanie, Wskaźniki sukcesu, Skalowalność).
- **FR-3.4**: **Asystent Kreatora (AI Co-Pilot)**:
  - Podpowiedzi ulepszeń w czasie rzeczywistym.
  - Wykrywanie luk logicznych (np. *"Nie wskazałeś, jak dotrzesz do seniorów niemobilnych"*).
  - Generowanie promptu wizualizacji koncepcyjnej przedmiotu/usługi (np. modularna łazienka, mobilna strefa relaksu).

### Moduł IV: Tester Innowacji (Platforma Ewaluacji)
- **FR-4.1**: Tablica otwartych testów prototypów (np. *"Testujemy aplikację z piktogramami dla osób z afazją"*).
- **FR-4.2**: Formularz rejestracji testera (profil: mieszkaniec, opiekun, pracownik socjalny, ekspert).
- **FR-4.3**: Cyfrowy dziennik informacji zwrotnej (ocena użyteczności SUS - System Usability Scale, zgłaszanie barier, sugestie ulepszeń).
- **FR-4.4**: Zautomatyzowany raport zbiorczy dla innowatora i ROPS Kraków.

### Moduł V: Platforma Aktywnej Komunikacji
- **FR-5.1**: Bezpośredni, ustrukturyzowany kanał pytań i odpowiedzi (Q&A) z ekspertami ROPS.
- **FR-5.2**: System powiązań międzysektorowych (Matchmaking Partnerski: NGO szuka partnera JST lub uczelni z Małopolski).
- **FR-5.3**: Baza mentorów z rezerwacją konsultacji online.
- **FR-5.4**: Wielokanałowe powiadomienia (in-app, email webhook).

### Moduł VI: Panel Administratora & Radar Trendów ROPS
- **FR-6.1**: Pulpit koordynatora ROPS: kolejka weryfikacji fiszek, akceptacja do publikacji, przypisywanie mentorów.
- **FR-6.2**: **Radar Trendów Społecznych (Admin Only)**:
  - Agregacja danych z zapytań mieszkańców i zgłaszanych problemów.
  - Wykresy i analiza sentymentu: jakich problemów przybywa w poszczególnych powiatach (np. *"Wzrost zgłoszeń dotyczących samotności młodzieży w powiecie oświęcimskim o 40%"*).
- **FR-6.3**: Eksport raportów do PDF / CSV na potrzeby Zarządu Województwa Małopolskiego.

### Moduł VII: Middleman Innowacji (Asystent Adaptacji do Usługi Publicznej)
- **FR-7.1**: Dedykowany asystent AI dla jednostek samorządu (gminy, CUS, MOPS).
- **FR-7.2**: Mechanizm adaptacyjny:
  - JST wybiera innowację z katalogu (np. *Mobilny Doradca Seniora*).
  - JST podaje specyfikę gminy (liczba mieszkańców, budżet, ukształtowanie terenu, istnienie CUS).
  - Asystent Middleman generuje gotowy **Pakiet Wdrożeniowy Usługi (Service Blueprint)**: opis procedury, kosztorys, kalkulacja etatów, propozycja uchwały rady gminy / regulaminu CUS, plan ryzyka.

---

## 4. Wymagania Niefunkcjonalne (NFR)

### 4.1. Dostępność Cyfrowa (WCAG 2.1 Poziom AA) – Waga 20%
- Zgodność ze standardem WCAG 2.1 AA (ustawa o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych).
- Narzędzia ułatwień w interfejsie:
  - Przełącznik wysokiego kontrastu (czarny-żółty, czarny-biały, ciemny motyw).
  - Skalowanie rozmiaru czcionki (100%, 125%, 150%) bez rozjeżdżania układu.
  - Pełna obsługa nawigacji klawiaturą (widoczny focus outline, skip links).
  - Atrybuty ARIA dla czytników ekranu (NVDA, JAWS).
  - **Przełącznik "Prosty Język" (Easy-to-Read / ETR)**: możliwość wyświetlenia uproszczonego streszczenia karty innowacji i formularza.

### 4.2. Bezpieczeństwo i RODO (Zasada Zero Real PII)
- Całkowity zakaz przetwarzania prawdziwych danych wrażliwych mieszkańców w prototypie.
- Wbudowany mechanizm pseudonimizacji / anonimizacji zgłoszeń (maskowanie PESEL, nazwisk, adresów przed wysłaniem do modelu LLM).
- Bezpieczne przechowywanie haseł (bcrypt/argon2), JWT tokeny dla sesji użytkowników.

### 4.3. Skalowalność i Wydajność
- Architektura oparta o asynchroniczne API (FastAPI) zdolna do obsługi tysięcy jednoczesnych użytkowników.
- Czas odpowiedzi wyszukiwania semantycznego RAG < 400 ms.
- Czas generowania odpowiedzi przez Middlemana AI zoptymalizowany przez streaming (Server-Sent Events - SSE).

### 4.4. Efektywność Kosztowa i Wdrożeniowa (TCO) – Waga 20%
- Możliwość wdrożenia w chmurze publicznej (np. Chmura Krajowa / Azure / AWS / GCP) lub na serwerach własnych Urzędu Marszałkowskiego Województwa Małopolskiego.
- Wykorzystanie open-source: Python, FastAPI, SQLite / PostgreSQL, pgvector / ChromaDB, Docker.
- Koszt utrzymania infrastruktury prototypu: < 150 PLN / miesięcznie (lub 0 PLN w wersji on-premise z lokalnymi modelami Ollama).

---

## 5. Macierz Śledzenia Wymagań (Traceability Matrix)

| Moduł Wyzwania | Komponent Backend | Komponent Frontend | Priorytet Hackathon |
|---|---|---|---|
| I. Matchmaking Społeczny | `/api/v1/matchmaking` (Vector RAG) | `views/MatchmakingView.tsx` | MUST HAVE (Obligatoryjny - 10%) |
| II. Zasobnik Wiedzy | `/api/v1/knowledge`, `/api/v1/challenges` | `views/KnowledgeView.tsx`, `views/MapView.tsx` | MUST HAVE (+5%) |
| III. Kreator Pomysłów & Canwa | `/api/v1/ideas`, `/api/v1/canvas`, `/api/v1/ai/assistant` | `views/IdeaCreatorView.tsx`, `components/Canvas/` | MUST HAVE (+5%) |
| IV. Tester Innowacji | `/api/v1/tester` | `views/TesterView.tsx` | MUST HAVE (+5%) |
| V. Platforma Komunikacji | `/api/v1/communication` | `views/CommunicationView.tsx` | MUST HAVE (+5%) |
| VI. Panel Administratora | `/api/v1/admin/trends`, `/api/v1/admin/moderation` | `views/AdminDashboardView.tsx` | MUST HAVE (+5%) |
| VII. Middleman Innowacji | `/api/v1/middleman/adapt` | `views/MiddlemanView.tsx` | MUST HAVE (+5%) |
| **Dostępność WCAG 2.1 AA** | Semantyczny HTML, i18n/ETR | `components/AccessibilityBar.tsx` | MUST HAVE (20%) |
| **Wdrożenie Docker** | Dockerfile, docker-compose.yml | Nginx container, SPA build | MUST HAVE (20%) |
