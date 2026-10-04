# Cel: dopracowanie MHIS pod kryteria wyzwania ROPS

Źródło: „Template wyzwania” ROPS Kraków (HackYeah 2026). Praca trwa na gałęzi `dev` – **nic nie trafia na `main`**.
Podgląd: `docker compose up --build` → http://localhost:3000

## Jak oceniają (§8 wyzwania) → na co celujemy

| Kryterium | Waga | Kierunek prac |
|---|---|---|
| Stopień spełnienia (7 modułów, Matchmaking obowiązkowy) | 40% | każdy moduł ma działać „do końca” – bez ślepych zaułków |
| Potencjał wdrożeniowy (skalowalność, integracje, koszt) | 20% | otwarte API/eksporty, powiadomienia o naborach, czytelny opis kosztu |
| Dostępność i intuicyjność (WCAG 2.1 AA, seniorzy) | 20% | prowadzenie użytkownika wg roli, prosty język, audyt axe |
| Atrakcyjność i pomysłowość UI | 10% | Mapa Wyzwań Małopolski, ciekawa prezentacja innowacji |
| Jakość materiałów/MVP | 10% | spójne komunikaty, brak placeholderów |

Walidacja (§6): intuicyjność dla osób w każdym wieku · ścieżka „nowy pomysł → powiadomienie admina → odpowiedź do autora” · trafność dopasowania po słowach kluczowych · nowa jakość zamiast kopii portali.

## Backlog

Status: ⏳ do zrobienia · 🚧 w toku · ✅ zrobione (commit) · ❌ odrzucone (z powodem)

| # | Usprawnienie | Moduł / kryterium | Status |
|---|---|---|---|
| G1 | Mapa Wyzwań Społecznych – interaktywny kartogram SVG 22 powiatów (zamiast kafelków), dostępny z klawiatury, z tabelą alternatywną | II / atrakcyjność | ✅ 3ad7036 |
| G2 | Start wg roli: „Jestem mieszkańcem / NGO / JST / ekspertem” → 2–3 najważniejsze akcje dla roli; prostszy język na stronie głównej | intuicyjność | ✅ 2ecf42e |
| G3 | Matchmaking: podświetlenie słów kluczowych z opisu, które zadecydowały o dopasowaniu + sekcja „Podobne zgłoszenia z regionu” | I / trafność | ✅ e991854 |
| G4 | „Moje sprawy” – oś czasu statusu fiszki/zgłoszenia (wysłano → ROPS przeczytał → decyzja → odpowiedź), widoczna dla autora | V / szybkość komunikacji | ✅ 24f32e4, cb75b95 |
| G5 | Subskrypcja powiadomień o naborach i nowych innowacjach (wg kategorii/powiatu) + automatyczny e-mail przy otwarciu naboru | integracja i automatyzacja | ✅ 24f32e4, cb75b95 |
| G6 | Tester: ocena innowacji (gwiazdki) i „zaproponuj usprawnienie” bezpośrednio z karty innowacji | IV | ✅ a6032ba, 021a933 |
| G7 | Biblioteka innowacji: atrakcyjniejsza karta (historia „problem → rozwiązanie → efekt”, wskaźniki, miejsce na film), filtr powiat/grupa | II / atrakcyjność | ✅ a6032ba, 021a933 |
| G8 | Panel ROPS: szybka edycja materiałów i wyzwań, eksport CSV zgłoszeń/potrzeb, licznik „nowe od ostatniego logowania” | VI | ✅ b0867a4 |
| G9 | Integracje: udokumentowane otwarte API (eksport JSON/CSV innowacji, webhook dla nowych fiszek) | potencjał wdrożeniowy | ✅ 37fc477 |
| G10 | Audyt dostępności (axe) wszystkich widoków + poprawki | WCAG | ⏳ przerwane limitem sesji – brak zmian; zrobiono tylko `no-cache` dla index.html |
| G11 | Kreator: wizualizacja pomysłu (szkic/plakat SVG generowany z Canwy) | III / asystent | 🚧 tylko backend `POST /canvas/poster-hints` (10c1d5d); komponent plakatu niedokończony (limit sesji) |
| G12 | Spójność i polerka: puste stany, komunikaty błędów, mobilny widok, teksty | jakość MVP | 🚧 częściowo: `no-cache` dla index.html, usunięte plakietki modułów |
| G13 | Nawigacja: 9 pozycji w górnym menu → grupy (Szukaj pomocy / Działaj / Współpracuj) + wyróżnione „Zgłoś”, okruszki | intuicyjność | ✅ 824d173 |
| G14 | Strona główna: pole „Twoja sprawa” widoczne bez przewijania (mniejszy nagłówek na laptopie 1366×768) | intuicyjność | ✅ 5854f0b |
| G15 | Panel eksperta/mentora: kolejka przydzielonych fiszek i pytań JST, szybki feedback (szablony odpowiedzi), widoczny dla autora w „Moich sprawach” | V / eksperci | ⏳ przerwane limitem sesji – niedokończony backend w worktree `dev-f`, nie scalony |
| G16 | Katalog dla JST: „Teczka wdrożeń” – porównanie 2–3 innowacji obok siebie (koszt, kadry, gotowość) i wydruk/PDF dla rady gminy | II+VII / JST | ⏳ przerwane limitem sesji – nie rozpoczęte |

## Dziennik decyzji

- **2026-10-04** – Gałąź `dev` utworzona z `main@25cf670` w worktree `.claude/worktrees/dev`. Niezacommitowane zmiany na `main` (PDF wniosku, usunięta prezentacja) zostają nietknięte – to praca autora, nie mieszamy jej z `dev`.
- **2026-10-04** – Prosty język (ETR) zawsze włączony, bez przełącznika (decyzja autora): mniej elementów w pasku, nikt nie trafi przypadkiem na trudniejszy tekst.
- **2026-10-04** – Bez plakietek „Moduł X”, ozdobnych chipów, zbędnych emotikonów i żargonu (Groq/LLM/AI) w interfejsie (decyzja autora) – wyglądały jak „AI tell” i nic nie wnosiły.
- **2026-10-04** – Podgląd zawsze z `dev`: `docker compose -p mhis-dev up --build` z worktree `dev` (wcześniej omyłkowo działał stos z katalogu `main`).
- **2026-10-04** – Priorytet wg wag kryteriów: najpierw to, co widać w demo i co jest nazwane w wyzwaniu wprost (Mapa Wyzwań, ścieżka komunikacji, trafność), potem integracje i audyt.

## Postęp

(uzupełniane po każdym zakończonym zadaniu: co zrobiono, commit, jak sprawdzono)

- **G1 Mapa Wyzwań Społecznych** (`3ad7036`, gałąź `dev-a`) – `MalopolskaMap.tsx` przepisany na heksagonalny kartogram SVG 22 powiatów (schematyczne położenie, miasta na prawach powiatu z przerywaną ramką). Wybór wskaźnika (seniorzy, dzieci i młodzież, zgłoszenia na 10 tys., innowacje na 100 tys., trend demograficzny), legenda z zakresami, wartość w każdym polu, Tab + strzałki + Enter, własny pierścień fokusu, tryby Ż/C i C/B, panel szczegółów (miejsce w rankingu, akcje: Matchmaking, innowacje z powiatu, Middleman), tabela danych jako alternatywa. Dane oznaczone jako demonstracyjne. Sprawdzono: `npm run build` (tsc) – OK; bez podglądu w przeglądarce.
- **G2 Start wg roli** (`2ecf42e`) – na stronie głównej sekcja „Kim jesteś?” z 4 rolami (Mieszkaniec lub organizacja, Samorząd, Ekspert lub mentor, Pracownik ROPS) i 2–3 dużymi linkami do istniejących modułów, z wersjami ETR; osobna sekcja dla urzędników scalona z rolą Samorząd; link „Wybierz, kim jesteś” pod fiszką. Uwaga: `HomeView.tsx` ma niezacommitowane zmiany na `main` – przy scaleniu możliwy konflikt.
- **G6 Tester z karty** (`a6032ba`, `021a933`) – nowa tabela `innovation_ratings` (ocena 1–5, propozycja usprawnienia, rola), endpointy `GET/POST /api/v1/testing/innovations/{id}/rating` i `GET /api/v1/testing/ratings`; propozycja trafia jako powiadomienie do Panelu ROPS. Na karcie: grupa radiowa 1–5 z opisami słownymi, „Zaproponuj usprawnienie” (do 1000 znaków), komunikaty `aria-live`, średnia i liczba ocen na karcie i na liście. Testy: `tests/test_innovation_card.py`; `pytest` – 22 passed.
- **G7 Biblioteka innowacji** (`a6032ba`, `021a933`) – pola `problem_statement` i `effect_description` (opisowe, bez zmyślonych liczb; uzupełniane w istniejących bazach przy starcie – sprawdzone na bazie ze starym schematem). Karta: historia Problem → Rozwiązanie → Efekt, wskaźniki (koszt, dla kogo, gotowość, gdzie sprawdzona), film tylko gdy jest adres, usunięty placeholder „film zostanie dodany”. Lista: filtry „Dla kogo” (szerokie grupy odbiorców) i „Gdzie sprawdzona” (powiat), `?tab=mapa` w adresie, z mapy przejście do innowacji z powiatu.
- **G4 „Moje sprawy” (24f32e4, cb75b95)** – `/status/:id` pokazuje pionową oś czasu: Wysłano → Przyjęte przez ROPS → W ocenie (mentor) → Decyzja → Odpowiedź koordynatora, z datami (nowe kolumny `read_at`, `review_started_at`, `decided_at`, `admin_notes_at` w `idea_fiszkas`, dodawane automatycznie na istniejących bazach). Autor po podaniu e-maila ze zgłoszenia widzi rozmowę z ROPS i zadaje pytania uzupełniające (tabela `case_messages`, powiadomienie w panelu); koordynator potwierdza przyjęcie, czyta i odpowiada (e-mail do autora). `/moje-sprawy` pamięta numery spraw w localStorage (bez e-maili); obsługuje też zgłoszenia `prob-…` z rejestru (publiczny status bez danych zgłaszającego). Panel ROPS: pasek „Wymaga Twojej uwagi”, plakietka z licznikiem przy „Panel ROPS” w nawigacji, „Nowa – nieprzyjęta” i licznik nieprzeczytanych pytań przy każdej fiszce. Sprawdzono: `pytest` (23 testy, w tym `test_cases_subscriptions.py`), `npm run build`, ręcznie w przeglądarce (oś czasu, weryfikacja e-mailem, wysłanie pytania, lista spraw).
- **G5 Subskrypcje powiadomień (24f32e4, cb75b95)** – `/powiadomienia`: e-mail + zgoda RODO, tematy (nabory / nowe innowacje), kategorie i powiaty (puste = wszystkie); ponowny zapis zmienia ustawienia. Wypisanie linkiem z tokenem `/powiadomienia/wypisz/:token`. Nabory przeniesione do bazy (`grant_calls`, startowe nabory demo wgrywane do pustej tabeli) i edytowalne w Panelu ROPS; nowy/zmieniony nabór (z opisem zmian) i nowa opublikowana innowacja automatycznie trafiają e-mailem do pasujących subskrybentów przez skrzynkę nadawczą. Panel pokazuje tylko liczby subskrybentów wg tematu, kategorii i powiatu oraz liczbę wysłanych alertów. Znane ograniczenia: brak double opt-in (potwierdzenia adresu), powiadomienie o naborze nie jest wysyłane automatycznie w dniu otwarcia zaplanowanego naboru (tylko przy dodaniu/zmianie).
- **G3 Matchmaking – trafność widoczna** (`e991854`, gałąź `dev-c`). API zwraca `matched_keywords` (słowa z opisu,
  które zdecydowały o dopasowaniu) i `highlights` (pozycje w `clean_query`); widok podświetla je `<mark>` (pogrubienie +
  podkreślenie, nie tylko kolor) i pokazuje „Dopasowano, bo w opisie jest: …” na każdej karcie. Nowa sekcja „Podobne
  zgłoszenia z regionu” (agregaty per powiat, bez treści zapytań mieszkańców). Wejście: 6 przykładów-chipów, podpowiedź
  długości + licznik, postęp analizy krokami (`role=status`). Ranking dostrojony na 7 zapytaniach (samotność seniorów,
  zdrowie psychiczne młodzieży, wykluczenie cyfrowe, transport na wsi, opieka nad osobą z niepełnosprawnością, spektrum
  w urzędzie, kontrolne spoza katalogu) – 2 wyniki były błędne, poprawione; opis: `docs/goal/matchmaking_eval.md`.
  Sprawdzone: `pytest` (5 nowych testów), `npm run build`.
- **G8 Panel ROPS** (`b0867a4`). Materiały edukacyjne przeniesione do bazy (tabela `educational_materials`, seed przy
  pierwszym użyciu) z edycją/ukrywaniem w panelu; szybka edycja kluczowego wyzwania i trendu powiatu (Mapa Wyzwań);
  eksport CSV fiszek, zgłoszeń i potrzeb zagregowanych (`;`, UTF-8 BOM, ochrona przed CSV injection, bez danych
  kontaktowych); licznik „Nowe od ostatniego logowania” (czas poprzedniego logowania w tokenie, tabela `app_state`).
  Radar trendów nadal tylko po zalogowaniu (test). Nowe tabele tworzy `create_all` przy starcie. Sprawdzone: `pytest`
  (5 nowych testów), `npm run build`.
- **G9 Integracje** (`37fc477`). Otwarte API tylko do odczytu `/api/v1/open/{innovations,challenges,needs}` (+ `.csv`),
  stronicowanie z linkami `next/previous`, CORS `*` wyłącznie dla `/open/*`. Opcjonalny webhook `WEBHOOK_URL`
  (`fiszka.created`, `problem_report.created`) w tle, bez PII, z podpisem HMAC (`WEBHOOK_SECRET`), błędy tylko w logach.
  Sekcja „4. Integracje” w `docs/api_specification.md`, strona `/otwarte-dane` i link w stopce. Sprawdzone: `pytest`
  (6 nowych testów), `npm run build`.
- **Prosty język zawsze włączony** – na prośbę autora usunięty przełącznik „Prosty język (ETR)” z paska dostępności; tryb ETR na stałe (`useAccessibilityStore.ts`, `AccessibilityBar.tsx`), stare ustawienie `mhis_etr` usuwane z `localStorage`.
- **Nawigacja i strona główna** (`824d173`, `5854f0b`) – menu w 4 grupach (Biblioteka i mapa, Działaj ▾, Rozmowa i pomoc, Dla samorządu ▾) + wyróżnione „Znajdź pomoc”, rozwijane menu dostępne z klawiatury, okruszki na podstronach; pole „Twoja sprawa” widoczne bez przewijania. Sprawdzone w podglądzie.
- **Usunięcie „AI tells”** – plakietki „Moduł I–VIII” usunięte ze wszystkich 8 widoków (sprawdzone w podglądzie). Przegląd emotikonów i ikon Sparkles przerwany limitem sesji – do dokończenia.
- **Cache** – nginx: `no-cache` dla index.html, długi cache dla `/assets/` (hash w nazwie). Po przebudowie przeglądarka zawsze dostaje nową wersję.
- **Stan na koniec sesji 2026-10-04** – `dev` buduje się w Dockerze (tsc OK), backend 43 testy OK. Niedokończone: G10, G11 (UI), G12, G15, G16, dokończenie przeglądu emotikonów/Sparkles.
