# Status poprawek po raporcie QA

Odpowiedź na `docs/QA_REPORT_browser_test.md` (test z 3.10.2026). Zmiany: commit `a6fef91` i kolejne.
Regresja: `backend/tests/test_qa_fixes.py` (11 testów) + dotychczasowe testy – razem 18, wszystkie przechodzą.

## Lista priorytetowa (§3 raportu)

| # | Problem | Status | Rozwiązanie |
|---|---|---|---|
| 1 | Matchmaking 500 (brak kolumny `title`) | ✅ | automatyczna migracja brakujących kolumn dla wszystkich tabel, `schema_ok` w `/health`, self-test przy starcie |
| 2 | Wyniki: bełkot 68%, brak sortowania, ten sam „why_matched” | ✅ | rozpoznawanie potrzeb + TF-IDF, sortowanie, próg trafności i stan „brak dopasowania”, uzasadnienie LLM per innowacja (szablon z dopasowanych potrzeb bez LLM), normalizacja polskich znaków |
| 3 | Filmy = Rick Roll, zmyślone PDF | ✅ | pola wyczyszczone w seedzie i w istniejących bazach; karta pokazuje film/podręcznik tylko, gdy są podane |
| 4 | Kolejka fiszek na sztywno, brak odpowiedzi do autora | ✅ | prawdziwa kolejka, `PATCH /ideas/{id}`, powiadomienia w panelu, e-mail do autora, publiczny status `/status/{id}` |
| 5 | Tryb wysokiego kontrastu pogarszał kontrast | ✅ | żółty na czarnym w całym interfejsie, aktywne elementy odwrócone |
| 6 | Pola bez etykiet | ✅ | etykiety we wszystkich formularzach |
| 7 | Modal bez `role="dialog"`, fokusu, Escape | ✅ | wspólny `useDialog` we wszystkich oknach |
| 8 | Middleman: gramatyka, 5 z 10 innowacji | ✅ | odmiana, format liczb, wszystkie innowacje z API, 404 dla nieznanego ID, walidacja |
| 9 | Filtr PII bez imion i adresów | ✅ | maskowanie adresów, kodów pocztowych, imion z nazwiskami, „pan/pani X” |
| 10 | Panel i `/ideas` bez logowania, brak zgód RODO | ✅ | logowanie koordynatora (JWT), zgody RODO w formularzach |
| 11 | Nieweryfikowalne deklaracje | ✅ | „10 innowacji (demo)”, „WCAG 2.1 AA – cel projektowy”, szacunek TCO z rozbiciem, stopka „prototyp HackYeah” (do korekty: podtytuł „Kojarzenie AI (98%)” wrócił w pasku Jury w commicie `239ccd3`) |

## Pozostałe uwagi z §2

- **Matchmaking**: 22 powiaty i opcja „cała Małopolska”, wszystkie kategorie z polskimi etykietami, walidacja powiatu i długości, miejscownik („w powiecie gorlickim”), alert trendu i liczba podobnych zgłoszeń z bazy, linki „Szczegóły” i „Zgłoś problem / Zaproponuj pomysł”, przykłady na stronie głównej uruchamiają wyszukiwanie.
- **Baza wiedzy**: wyszukiwanie na żywo bez względu na polskie znaki, stan pustego wyniku, pełne kategorie, karta pod adresem `/baza-wiedzy/{id}` z budżetem, grupami, gotowością i przyciskami akcji, zakładki ARIA, materiały z API z oznaczeniem linków zewnętrznych, oznaczenia tekstowe na kafelkach powiatów.
- **Kreator**: etap realizacji, lista powiatów, zgoda RODO, walidacja e-maila po stronie serwera, wysyłka fiszki do ROPS; checklista Canwy uczciwie nazwana (reguły), wykrywa niezweryfikowanych partnerów; prompt LLM ogranicza partnerów do typów instytucji i SUS do rozwiązań cyfrowych; szkic wniosku tylko dla otwartych naborów, w limicie kwot, z wykazem braków.
- **Tester**: brak overbookingu i duplikatów, komunikat po zapisie, prawdziwy SUS (10 pytań), karty dostępne z klawiatury, rola „młodzież” ze zgodą opiekuna.
- **Dialog**: podpis i rola przy odpowiedziach, etykiety kategorii i ról, daty, rezerwacja konsultacji z plikiem `.ics`, oznaczenie nowych wiadomości, `aria-live`, e-maile mentorów w `example.org`.
- **Panel ROPS**: trendy liczone z bazy (główny obszar z kategorii zgłoszeń, wzrost kw/kw lub „brak danych”), wykres 22 powiatów z tabelą danych, skrzynka nadawcza e-mail, edycja katalogu innowacji.
- **Rejestr wyzwań**: działa, komunikaty błędów, lista 22 powiatów, etykiety, bez słowa „oficjalne”, anonimowe zapytania Matchmakingu ukryte w rejestrze.
- **Globalnie**: strona 404, tytuły stron, menu mobilne, pasek Jury z możliwością zwinięcia (zapamiętywane), poprawne 125%/150%, `aria-pressed`, poprawiony kontrast drobnego tekstu, deklaracja dostępności, czytelne błędy walidacji API.
- **Dane testowe QA**: wpisy z prefiksem `TEST-QA` / `QA-TEST` są usuwane przy starcie; przepełnione kampanie są zamykane.

## Nie zrealizowano (propozycje z §4–§5)

- mapa SVG Małopolski (kartogram) – są kafelki z oznaczeniami tekstowymi,
- embeddingi i PostgreSQL + pgvector + Alembic,
- SSO i role użytkowników (jest jedno hasło koordynatora),
- generowanie obrazu wizualizacji Canwy (jest opis do skopiowania),
- wersje UA/EN, PWA offline, eksport DOCX, integracje (grant DB, CSV/XLSX),
- pełna wersja ETR wszystkich tekstów, audyt axe/NVDA.
