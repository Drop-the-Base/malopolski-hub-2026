# Design system: Małopolski Hub Innowacji Społecznych

Ten dokument opisuje kierunek wizualny prototypu MHIS i to, jak jest wdrożony w kodzie
(`frontend/tailwind.config.js`, `frontend/src/index.css`, powłoka aplikacji i strona główna).

## 1. Dla kogo i po co

| | |
|---|---|
| **Temat** | Publiczna platforma regionalna (koncepcja dla ROPS Kraków), która łączy potrzeby mieszkańców z katalogiem sprawdzonych innowacji społecznych i pomaga gminom je wdrożyć. |
| **Odbiorcy** | Seniorzy i ich rodziny, organizacje pozarządowe, urzędnicy gmin i powiatów (JST, CUS, GOPS), koordynatorzy ROPS. Często starsze oczy, słabszy sprzęt, mała cierpliwość do „aplikacji”. |
| **Główne zadanie** | Pozwolić komuś opisać problem własnymi słowami i dostać sprawdzone rozwiązanie. Wszystko inne jest drugorzędne. |
| **Ton** | Urząd, który słucha. Spokojny, rzeczowy, czytelny. Nie startup, nie „AI-magia”. |

### Co było nie tak (diagnoza „wygląda jak z AI”)

- Ciemnogranatowe hero z gradientem `blue-900 → indigo-950` i rozmytą kulą światła w rogu.
- Pigułka-etykieta nad nagłówkiem („Cyfrowe Serce…”) z ikoną ✨.
- Cztery identyczne zaokrąglone karty z ikoną w kwadracie, cieniem i strzałką `→` na końcu.
- Drugi baner z gradientem (rose → slate), znów z pigułką nad nagłówkiem.
- Pasek „wielka liczba + mała etykieta WERSALIKAMI” jako dowód.
- Wszędzie `rounded-2xl` i ten sam cień, fiolet/indygo bez związku z tematem, 66 etykiet `uppercase tracking-wider`.

## 2. Pomysł: fiszka

Platforma nazywa zgłoszenie mieszkańca **fiszką**. Fiszka to kartonik z biblioteki lub urzędu:
biały papier, niebieskie linie, czerwona linia nagłówka. To jest jedyny „głośny” element projektu.
Hero strony głównej to po prostu wielka fiszka, w której piszesz swój problem. Reszta strony jest
cicha: papierowe tło, atramentowy tekst, jedna regionalna niebieska barwa do działań.

Zasady:

1. **Czytelność jest tożsamością.** Krój pisma zaprojektowany dla osób słabowidzących,
   duży tekst, krótkie linie. To nie dodatek WCAG, to charakter marki.
2. **Odwaga w jednym miejscu.** Fiszka w hero. Nigdzie więcej linii, przekrzywień czy ozdobników.
3. **Struktura niesie informację.** Ramka, numer czy linia pojawia się tylko wtedy, gdy coś znaczy
   (numery tylko dla prawdziwej sekwencji, np. kroki ścieżki dla jury).
4. **Kolory regionu, nie kolory szablonu.** Niebieski i żółty z identyfikacji Małopolski,
   czerwień tylko jako linia fiszki i komunikaty błędów.
5. **Bez gradientów, rozmyć, wersalików w etykietach i strzałek `→` doklejanych do tekstu.**

## 3. Tokeny

### Kolor

| Nazwa | Hex | Rola |
|---|---|---|
| Papier | `#F5F6F3` | Tło strony (chłodny, wapienny biały, nie kremowy). |
| Karta | `#FFFFFF` | Powierzchnie: formularze, panele, fiszka. |
| Atrament | `#17233A` | Tekst główny, ciemne paski (dostępność, stopka). Granat urzędowego atramentu zamiast „prawie czarnego”. |
| Niebieski Małopolski | `#034EA2` | Jedyny kolor działania: przyciski główne, linki, stan aktywny. 8,0 : 1 na białym. |
| Żółty Małopolski | `#FFD100` | Marker: pierścień fokusu, aktywny tryb ETR, podkreślenie bieżącej strony. Nigdy jako kolor tekstu na jasnym tle. |
| Linia fiszki | `#BCD0EA` | Linie liniatury fiszki i delikatne obramowania niebieskie. |
| Czerwień marginesu | `#C8102E` | Linia nagłówka fiszki; komunikaty błędów. |
| Las | `#2F6B4F` | Sukces, potwierdzenia. |

Wdrożenie w Tailwind (`tailwind.config.js`) nadpisuje istniejące skale, więc wszystkie widoki
dostają nowy wygląd bez przepisywania klas:

- `slate-*` → chłodna, lekko granatowa szarość „kamień” (`50` = Papier, `900` = Atrament).
- `blue-*` → skala zbudowana na Niebieskim Małopolski (`600` = `#034EA2`).
- `indigo-*`, `violet-*`, `purple-*` → aliasy skali niebieskiej (koniec z przypadkowym fioletem).
- `amber-300/400` → odcienie Żółtego Małopolski.
- `malopolska.*` → nazwane tokeny z tabeli powyżej (`paper`, `ink`, `blue`, `yellow`, `rule`, `margin`, `forest`).

### Typografia

| Krój | Rola |
|---|---|
| **Atkinson Hyperlegible Next** (Google Fonts, 200–800, pełne polskie znaki) | Jedyny krój: nagłówki, tekst, interfejs. Zaprojektowany przez Braille Institute dla osób słabowidzących: wyraźnie różne `I l 1`, `O 0`, otwarte kształty. Pasuje do odbiorców (seniorzy) i do misji (WCAG). |

Charakter nadaje skala i waga, nie drugi krój. Skala według klasycznej skali typograficznej
(Bringhurst, *The Elements of Typographic Style*): 12 · 14 · 16 · 18 · 21 · 24 · 36 · 48 · 60.

| Poziom | Rozmiar / interlinia | Waga | Uwagi |
|---|---|---|---|
| Hero (h1 strony głównej) | 32 → 48 px / 1.08 | 800 | `letter-spacing: -0.02em`, maks. 28 znaków na linię – pole „Twoja sprawa” musi być widoczne bez przewijania na 1366×768 i 390×844. |
| Nagłówek strony (h1) | 36 px / 1.15 | 800 | |
| Sekcja (h2) | 24 px / 1.25 | 700 | |
| Podsekcja (h3) | 18 px / 1.35 | 700 | |
| Tekst | 16–18 px / 1.6 | 400 | Maks. ~70 znaków w linii (`max-w-prose`). |
| Tekst fiszki | 21 px / 36 px | 400 | Interlinia = odstęp linii liniatury. |
| Drobny | 14 px / 1.5 | 400–600 | Najmniejszy rozmiar dla treści. 12 px tylko dla pomocniczych metadanych. |

Etykiety: zdaniowe („Moduły platformy”), bez wersalików i rozstrzelenia. Liczby w tabelach i
wskaźnikach: `tabular-nums`.

### Kształt i głębia

| Token | Wartość | Gdzie |
|---|---|---|
| `rounded` | 4 px | Znaczniki, drobne przyciski. |
| `rounded-lg` | 6 px | Przyciski, pola formularzy. |
| `rounded-xl` | 8 px | Panele, karty treści. |
| `rounded-2xl` | 10 px | Duże sekcje. |
| `rounded-3xl` | 12 px | Maksimum. |
| Fiszka | 2 px | Papier ma ostre rogi. |
| Cienie | 1 px linia + bardzo miękki cień atramentowy | Hierarchię robi obramowanie i tło, nie cień. Fiszka jako jedyna „leży” na stronie (wyraźniejszy cień). |

### Fokus i stany

- Fokus klawiatury: obrys 3 px Atrament + 6 px poświata Żółtego Małopolski. Widoczny na
  jasnym i ciemnym tle.
- Bieżąca strona w nawigacji: tekst Atrament + żółta belka 4 px pod spodem (marker).
- Hover: zmiana koloru tła/tekstu, bez skalowania i bez cieni „unoszenia”.
- Ruch: brak animacji wejścia sekcji. Jedyne przejścia to odpowiedź na akcję (otwarcie menu,
  rozwinięcie paska). `prefers-reduced-motion` wyłącza wszystko.

## 4. Układ

Treść wyrównana do lewej. Wyśrodkowanie tylko dla pustych stanów i komunikatów 404.

### Strona główna

```
┌──────────────────────────────────────────────────────────────┐
│ Pasek dostępności (Atrament, 1 linia)                        │
├──────────────────────────────────────────────────────────────┤
│ [MH] Małopolski Hub      Znajdź rozwiązanie  Rejestr  Baza … │  ← żółta belka pod aktywną
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Opisz, co dzieje się                                        │
│  w Twojej okolicy.                     (h1, 60px, 800)       │
│  Podpowiemy sprawdzone rozwiązanie.                          │
│                                                              │
│  ┌═══════════════════ czerwona linia ═══════════════════┐    │
│  │ Fiszka                            Twoje słowa wystarczą│   │
│  │ ───────────────────────────────────────────────────── │   │
│  │ W naszej wsi starsze osoby nie mają jak dojechać…     │   │  ← liniatura, 21px
│  │ ───────────────────────────────────────────────────── │   │
│  │ ───────────────────────────────────────────────────── │   │
│  │                              [ Dopasuj rozwiązanie ]  │   │
│  └───────────────────────────────────────────────────────┘   │
│  Na przykład: samotni seniorzy bez dojazdu, lęk u młodzieży… │  ← zwykłe linki
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Kim jesteś?          │ Mieszkańcy i organizacje        ─────│
│ (kolumna 1/3)        │ Gminy i powiaty                 ─────│  ← lista z liniami,
│                      │ Autorzy pomysłów                ─────│     nie karty
│                      │ Pracownicy ROPS                 ─────│
├──────────────────────────────────────────────────────────────┤
│ ▌ Pracujesz w gminie, CUS lub GOPS?                          │  ← niebieska linia 4px
│ ▌ Wpisz wyzwania gminy …            [Otwórz rejestr wyzwań]  │
├──────────────────────────────────────────────────────────────┤
│ O prototypie: 4 fakty jako zdania w 2 kolumnach              │
└──────────────────────────────────────────────────────────────┘
```

Mobile (< 640 px): jedna kolumna, h1 32 px, przycisk fiszki na pełną szerokość, margines boczny 16 px.
Pasek „Ścieżka dla jury” jest domyślnie zwinięty, gdy okno ma mniej niż 900 px wysokości lub 768 px szerokości (wybór użytkownika jest zapamiętywany).

### Powłoka

- **Pasek dostępności**: Atrament, przyciski jako segmenty z wyraźnym stanem `aria-pressed`
  (żółty dla ETR, biały/niebieski dla wybranych opcji).
- **Nawigacja**: biała, linia 1 px u dołu, logo jako prostokątny znak `MH` w Niebieskim
  Małopolski (bez gradientu). Najwyżej 4 pozycje: „Biblioteka i mapa”, „Działaj” ▾ (zgłoś pomysł,
  testuj, sprawdź zgłoszenie), „Rozmowa i pomoc”, „Dla samorządu” ▾ (plan dla gminy, rejestr wyzwań,
  Panel ROPS) + jedno wyróżnione wezwanie „Znajdź pomoc” (niebieski przycisk). Grupy to przyciski
  z `aria-expanded` (otwierane kliknięciem, nie najechaniem; Escape zamyka). Aktywna pozycja z żółtą belką.
  Konfiguracja w `components/layout/navConfig.ts`; menu mobilne pokazuje te same grupy jako sekcje.
  Na podstronach okruszki „Jesteś tutaj” (Strona główna › grupa › strona).
- **Ścieżka dla jury**: ciemny pasek Atramentu, kroki 1–4 (prawdziwa sekwencja, więc numery
  są uzasadnione), bez gradientowej pigułki.
- **Stopka**: Atrament, dwie kolumny, nagłówki zdaniowe, zastrzeżenie o prototypie zachowane.

## 5. Język interfejsu

- Zdania, nie hasła. „Dopasuj rozwiązanie”, nie „Dopasuj innowację z AI ✨”.
- Nazwy z perspektywy użytkownika: „Znajdź rozwiązanie”, „Zgłoś wyzwanie gminy”,
  nie „Matchmaking RAG”.
- Przycisk mówi, co się stanie. Ta sama nazwa działania w całym przepływie.
- Błędy mówią, co się stało i co zrobić. Nie przepraszają.
- Tryb ETR (prosty język) ma własne, krótsze wersje tekstów — każdy nowy tekst potrzebuje obu wersji.

## 6. Czego nie robić

| Nie | Zamiast |
|---|---|
| `bg-gradient-to-*`, rozmyte kule światła | Płaskie tło Papier/Karta/Atrament |
| `uppercase tracking-wider` na etykietach | Etykieta zdaniowa, waga 600 |
| Pigułka nad nagłówkiem („Nowy moduł: …”) | Nic albo jedno zdanie pod nagłówkiem |
| Siatka identycznych kart z ikoną w kwadracie | Lista z liniami lub tabela |
| `→` / `ArrowRight` doklejone do tekstu linku | Sam czytelny tekst linku |
| Fiolet, indygo, róż jako akcent | Niebieski Małopolski |
| `hover:scale-*`, `hover:shadow-xl` | Zmiana koloru tła lub podkreślenia |
| Tekst 10–11 px | Minimum 12 px, treść ≥ 14 px |

## 7. Tryby dostępności

Tryby wysokiego kontrastu (`theme-yellow-black`, `theme-black-white`) w `index.css` nadpisują
wszystkie kolory i obrazy tła (`!important`), więc liniatura fiszki znika, a fiszka pozostaje
zwykłym polem z obramowaniem. Każdy nowy element musi działać bez tła i bez cienia.
Powiększenie tekstu (125%/150%) skaluje `html { font-size }` — używaj `rem`, nie `px`, dla rozmiarów pisma.

## 8. Stan wdrożenia

| Obszar | Stan |
|---|---|
| Tokeny (kolor, krój, promienie, cienie, fokus) | Wdrożone globalnie — działają we wszystkich widokach. |
| Pasek dostępności, nawigacja, ścieżka jury, stopka | Przeprojektowane. |
| Strona główna | Przeprojektowana (fiszka w hero). |
| Gradienty w widokach (Canwa, Tester, Matchmaking, Panel ROPS, mapa) | Zastąpione płaskimi kolorami. |
| Etykiety wersalikami w widokach | Usunięte (`uppercase`, `tracking-wider`), poza drukowanym wnioskiem, gdzie wersaliki są konwencją dokumentu urzędowego. |
| Widoki modułów (układ wewnętrzny) | Dziedziczą tokeny; dalsze porządki według sekcji 6 przy kolejnych zmianach. |
