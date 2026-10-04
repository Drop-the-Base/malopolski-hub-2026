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
| G1 | Mapa Wyzwań Społecznych – interaktywny kartogram SVG 22 powiatów (zamiast kafelków), dostępny z klawiatury, z tabelą alternatywną | II / atrakcyjność | ⏳ |
| G2 | Start wg roli: „Jestem mieszkańcem / NGO / JST / ekspertem” → 2–3 najważniejsze akcje dla roli; prostszy język na stronie głównej | intuicyjność | ⏳ |
| G3 | Matchmaking: podświetlenie słów kluczowych z opisu, które zadecydowały o dopasowaniu + sekcja „Podobne zgłoszenia z regionu” | I / trafność | ✅ e991854 |
| G4 | „Moje sprawy” – oś czasu statusu fiszki/zgłoszenia (wysłano → ROPS przeczytał → decyzja → odpowiedź), widoczna dla autora | V / szybkość komunikacji | ⏳ |
| G5 | Subskrypcja powiadomień o naborach i nowych innowacjach (wg kategorii/powiatu) + automatyczny e-mail przy otwarciu naboru | integracja i automatyzacja | ⏳ |
| G6 | Tester: ocena innowacji (gwiazdki) i „zaproponuj usprawnienie” bezpośrednio z karty innowacji | IV | ⏳ |
| G7 | Biblioteka innowacji: atrakcyjniejsza karta (historia „problem → rozwiązanie → efekt”, wskaźniki, miejsce na film), filtr powiat/grupa | II / atrakcyjność | ⏳ |
| G8 | Panel ROPS: szybka edycja materiałów i wyzwań, eksport CSV zgłoszeń/potrzeb, licznik „nowe od ostatniego logowania” | VI | ✅ b0867a4 |
| G9 | Integracje: udokumentowane otwarte API (eksport JSON/CSV innowacji, webhook dla nowych fiszek) | potencjał wdrożeniowy | ✅ 37fc477 |
| G10 | Audyt dostępności (axe) wszystkich widoków + poprawki | WCAG | ⏳ |
| G11 | Kreator: wizualizacja pomysłu (szkic/plakat SVG generowany z Canwy) | III / asystent | ⏳ |
| G12 | Spójność i polerka: puste stany, komunikaty błędów, mobilny widok, teksty | jakość MVP | ⏳ |

## Dziennik decyzji

- **2026-10-04** – Gałąź `dev` utworzona z `main@25cf670` w worktree `.claude/worktrees/dev`. Niezacommitowane zmiany na `main` (PDF wniosku, usunięta prezentacja) zostają nietknięte – to praca autora, nie mieszamy jej z `dev`.
- **2026-10-04** – Priorytet wg wag kryteriów: najpierw to, co widać w demo i co jest nazwane w wyzwaniu wprost (Mapa Wyzwań, ścieżka komunikacji, trafność), potem integracje i audyt.

## Postęp

(uzupełniane po każdym zakończonym zadaniu: co zrobiono, commit, jak sprawdzono)

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
