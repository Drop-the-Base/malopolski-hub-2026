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
| G3 | Matchmaking: podświetlenie słów kluczowych z opisu, które zadecydowały o dopasowaniu + sekcja „Podobne zgłoszenia z regionu” | I / trafność | ⏳ |
| G4 | „Moje sprawy” – oś czasu statusu fiszki/zgłoszenia (wysłano → ROPS przeczytał → decyzja → odpowiedź), widoczna dla autora | V / szybkość komunikacji | ⏳ |
| G5 | Subskrypcja powiadomień o naborach i nowych innowacjach (wg kategorii/powiatu) + automatyczny e-mail przy otwarciu naboru | integracja i automatyzacja | ⏳ |
| G6 | Tester: ocena innowacji (gwiazdki) i „zaproponuj usprawnienie” bezpośrednio z karty innowacji | IV | ✅ a6032ba, 021a933 |
| G7 | Biblioteka innowacji: atrakcyjniejsza karta (historia „problem → rozwiązanie → efekt”, wskaźniki, miejsce na film), filtr powiat/grupa | II / atrakcyjność | ✅ a6032ba, 021a933 |
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

- **G1 Mapa Wyzwań Społecznych** (`3ad7036`, gałąź `dev-a`) – `MalopolskaMap.tsx` przepisany na heksagonalny kartogram SVG 22 powiatów (schematyczne położenie, miasta na prawach powiatu z przerywaną ramką). Wybór wskaźnika (seniorzy, dzieci i młodzież, zgłoszenia na 10 tys., innowacje na 100 tys., trend demograficzny), legenda z zakresami, wartość w każdym polu, Tab + strzałki + Enter, własny pierścień fokusu, tryby Ż/C i C/B, panel szczegółów (miejsce w rankingu, akcje: Matchmaking, innowacje z powiatu, Middleman), tabela danych jako alternatywa. Dane oznaczone jako demonstracyjne. Sprawdzono: `npm run build` (tsc) – OK; bez podglądu w przeglądarce.
- **G2 Start wg roli** (`2ecf42e`) – na stronie głównej sekcja „Kim jesteś?” z 4 rolami (Mieszkaniec lub organizacja, Samorząd, Ekspert lub mentor, Pracownik ROPS) i 2–3 dużymi linkami do istniejących modułów, z wersjami ETR; osobna sekcja dla urzędników scalona z rolą Samorząd; link „Wybierz, kim jesteś” pod fiszką. Uwaga: `HomeView.tsx` ma niezacommitowane zmiany na `main` – przy scaleniu możliwy konflikt.
- **G6 Tester z karty** (`a6032ba`, `021a933`) – nowa tabela `innovation_ratings` (ocena 1–5, propozycja usprawnienia, rola), endpointy `GET/POST /api/v1/testing/innovations/{id}/rating` i `GET /api/v1/testing/ratings`; propozycja trafia jako powiadomienie do Panelu ROPS. Na karcie: grupa radiowa 1–5 z opisami słownymi, „Zaproponuj usprawnienie” (do 1000 znaków), komunikaty `aria-live`, średnia i liczba ocen na karcie i na liście. Testy: `tests/test_innovation_card.py`; `pytest` – 22 passed.
- **G7 Biblioteka innowacji** (`a6032ba`, `021a933`) – pola `problem_statement` i `effect_description` (opisowe, bez zmyślonych liczb; uzupełniane w istniejących bazach przy starcie – sprawdzone na bazie ze starym schematem). Karta: historia Problem → Rozwiązanie → Efekt, wskaźniki (koszt, dla kogo, gotowość, gdzie sprawdzona), film tylko gdy jest adres, usunięty placeholder „film zostanie dodany”. Lista: filtry „Dla kogo” (szerokie grupy odbiorców) i „Gdzie sprawdzona” (powiat), `?tab=mapa` w adresie, z mapy przejście do innowacji z powiatu.
