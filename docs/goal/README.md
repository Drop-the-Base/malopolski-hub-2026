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
| G3 | Matchmaking: podświetlenie słów kluczowych z opisu, które zadecydowały o dopasowaniu + sekcja „Podobne zgłoszenia z regionu” | I / trafność | ⏳ |
| G4 | „Moje sprawy” – oś czasu statusu fiszki/zgłoszenia (wysłano → ROPS przeczytał → decyzja → odpowiedź), widoczna dla autora | V / szybkość komunikacji | ✅ 24f32e4, cb75b95 |
| G5 | Subskrypcja powiadomień o naborach i nowych innowacjach (wg kategorii/powiatu) + automatyczny e-mail przy otwarciu naboru | integracja i automatyzacja | ✅ 24f32e4, cb75b95 |
| G6 | Tester: ocena innowacji (gwiazdki) i „zaproponuj usprawnienie” bezpośrednio z karty innowacji | IV | ⏳ |
| G7 | Biblioteka innowacji: atrakcyjniejsza karta (historia „problem → rozwiązanie → efekt”, wskaźniki, miejsce na film), filtr powiat/grupa | II / atrakcyjność | ⏳ |
| G8 | Panel ROPS: szybka edycja materiałów i wyzwań, eksport CSV zgłoszeń/potrzeb, licznik „nowe od ostatniego logowania” | VI | ⏳ |
| G9 | Integracje: udokumentowane otwarte API (eksport JSON/CSV innowacji, webhook dla nowych fiszek) | potencjał wdrożeniowy | ⏳ |
| G10 | Audyt dostępności (axe) wszystkich widoków + poprawki | WCAG | ⏳ |
| G11 | Kreator: wizualizacja pomysłu (szkic/plakat SVG generowany z Canwy) | III / asystent | ⏳ |
| G12 | Spójność i polerka: puste stany, komunikaty błędów, mobilny widok, teksty | jakość MVP | ⏳ |

## Dziennik decyzji

- **2026-10-04** – Gałąź `dev` utworzona z `main@25cf670` w worktree `.claude/worktrees/dev`. Niezacommitowane zmiany na `main` (PDF wniosku, usunięta prezentacja) zostają nietknięte – to praca autora, nie mieszamy jej z `dev`.
- **2026-10-04** – Priorytet wg wag kryteriów: najpierw to, co widać w demo i co jest nazwane w wyzwaniu wprost (Mapa Wyzwań, ścieżka komunikacji, trafność), potem integracje i audyt.

## Postęp

(uzupełniane po każdym zakończonym zadaniu: co zrobiono, commit, jak sprawdzono)

- **G4 „Moje sprawy” (24f32e4, cb75b95)** – `/status/:id` pokazuje pionową oś czasu: Wysłano → Przyjęte przez ROPS → W ocenie (mentor) → Decyzja → Odpowiedź koordynatora, z datami (nowe kolumny `read_at`, `review_started_at`, `decided_at`, `admin_notes_at` w `idea_fiszkas`, dodawane automatycznie na istniejących bazach). Autor po podaniu e-maila ze zgłoszenia widzi rozmowę z ROPS i zadaje pytania uzupełniające (tabela `case_messages`, powiadomienie w panelu); koordynator potwierdza przyjęcie, czyta i odpowiada (e-mail do autora). `/moje-sprawy` pamięta numery spraw w localStorage (bez e-maili); obsługuje też zgłoszenia `prob-…` z rejestru (publiczny status bez danych zgłaszającego). Panel ROPS: pasek „Wymaga Twojej uwagi”, plakietka z licznikiem przy „Panel ROPS” w nawigacji, „Nowa – nieprzyjęta” i licznik nieprzeczytanych pytań przy każdej fiszce. Sprawdzono: `pytest` (23 testy, w tym `test_cases_subscriptions.py`), `npm run build`, ręcznie w przeglądarce (oś czasu, weryfikacja e-mailem, wysłanie pytania, lista spraw).
- **G5 Subskrypcje powiadomień (24f32e4, cb75b95)** – `/powiadomienia`: e-mail + zgoda RODO, tematy (nabory / nowe innowacje), kategorie i powiaty (puste = wszystkie); ponowny zapis zmienia ustawienia. Wypisanie linkiem z tokenem `/powiadomienia/wypisz/:token`. Nabory przeniesione do bazy (`grant_calls`, startowe nabory demo wgrywane do pustej tabeli) i edytowalne w Panelu ROPS; nowy/zmieniony nabór (z opisem zmian) i nowa opublikowana innowacja automatycznie trafiają e-mailem do pasujących subskrybentów przez skrzynkę nadawczą. Panel pokazuje tylko liczby subskrybentów wg tematu, kategorii i powiatu oraz liczbę wysłanych alertów. Znane ograniczenia: brak double opt-in (potwierdzenia adresu), powiadomienie o naborze nie jest wysyłane automatycznie w dniu otwarcia zaplanowanego naboru (tylko przy dodaniu/zmianie).
